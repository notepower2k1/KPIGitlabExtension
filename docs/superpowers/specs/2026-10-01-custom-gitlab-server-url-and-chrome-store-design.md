# Design Specification: Custom GitLab Server URL & Chrome Web Store Readiness

- **Feature Name:** Custom GitLab Server URL & Chrome Web Store Readiness
- **Target Audience:** Any GitLab user (GitLab.com users, enterprise self-hosted GitLab users, and community edition instances).
- **Date:** 2026-10-01
- **Status:** Approved

---

## 1. Executive Summary

This specification defines the architecture, data models, UI/UX workflows, dynamic content script registration, and packaging pipeline required to make the extension **TimeLab** fully independent of any hardcoded GitLab instance, supporting any GitLab server URL (GitLab.com and self-hosted instances) and satisfying all Chrome Web Store developer and security criteria.

---

## 2. Core Requirements & Architecture

### 2.1 Storage Key & Normalization
1. **Storage Key**: `gitlabServerUrl` in `chrome.storage.local`.
2. **Default Value**: `https://gitlab.com` if not explicitly set.
3. **URL Normalizer Utility**: `sanitizeGitlabUrl(rawUrl)`:
   - Trims whitespace.
   - Prepends `https://` if protocol is missing (e.g. `gitlab.company.com` ➔ `https://gitlab.company.com`).
   - Removes trailing slashes (e.g. `https://gitlab.com/` ➔ `https://gitlab.com`).
   - Strips deep sub-paths (e.g. `https://gitlab.company.com/explore` ➔ `https://gitlab.company.com`).
   - Returns valid standardized URL string or fallback default `https://gitlab.com`.

### 2.2 Global Endpoint Routing
All API calls throughout the extension replace hardcoded domains with `gitlabServerUrl`:
- **Login Authentication** (`popup/popup.js`):
  `GET ${gitlabServerUrl}/api/v4/user` with `PRIVATE-TOKEN: <token>`.
- **Token Generation Link Helper** (`popup/popup.js`):
  Opens `${gitlabServerUrl}/-/user_settings/personal_access_tokens` (or `/-/profile/personal_access_tokens`).
- **Unadded KPI Tasks Background Check** (`background.js`):
  Queries `${gitlabServerUrl}/api/v4/issues?scope=created_by_me&state=opened&created_after=${todayStartIso}`.
- **Monthly Analytics & GraphQL** (`page/page.js`):
  Queries `${gitlabServerUrl}/api/graphql` and builds parent/child issue links with `${gitlabServerUrl}/${projectPath}/-/issues/${iid}`.
- **GitLab Modal In-Page Queries** (`content_issue.js`):
  Uses `window.location.origin + '/api/graphql'` when on-page or configured `gitlabServerUrl`.

---

## 3. Dynamic Content Script Registration (Manifest V3 Compliance)

To display the **"📊 Tổng hợp task"** and **"Thêm vào KPI"** buttons directly inside GitLab issue and work item pages across any self-hosted domain without requiring intrusive broad matches like `*://*/*`:

1. **Static Matches in `manifest.json`**:
   - `*://gitlab.com/*/-/issues/*`, `*://gitlab.com/*/-/work_items/*`, `*://gitlab.com/*/-/merge_requests/*`.
   - `*://gitlab.widosoft.com/*/-/issues/*`, `*://gitlab.widosoft.com/*/-/work_items/*`, `*://gitlab.widosoft.com/*/-/merge_requests/*`.
2. **Dynamic Script Registration (`background.js`)**:
   - Function `syncDynamicContentScript(serverUrl)`:
     - Extracts origin (e.g. `https://gitlab.mycorp.vn`).
     - If origin is already covered by static matches (`gitlab.com` or `gitlab.widosoft.com`), unregisters dynamic script id `'custom-gitlab-scripts'` to avoid duplicate execution.
     - If origin is a custom self-hosted domain:
       - Unregisters `'custom-gitlab-scripts'` if previously registered.
       - Calls `chrome.scripting.registerContentScripts` with:
         ```javascript
         [{
             id: 'custom-gitlab-scripts',
             matches: [
                 `${origin}/*/-/issues/*`,
                 `${origin}/*/-/work_items/*`,
                 `${origin}/*/-/merge_requests/*`
             ],
             js: ['utils.js', 'i18n.js', 'content_issue.js'],
             runAt: 'document_idle'
         }]
         ```
   - Triggered on:
     - Initial load / startup in `background.js`.
     - When `gitlabServerUrl` changes in `chrome.storage.onChanged`.
     - When user logs in or updates server URL in `popup/popup.js`.

---

## 4. UI/UX Design & Multilingual Integration

### 4.1 Login Screen (`popup/popup.html`)
- Positioned right above the Access Token input field:
  - Label: `data-i18n="gitlabServerUrlLabel"` ("GitLab Server URL:").
  - URL Input: `<input type="url" id="serverUrlInput" placeholder="https://gitlab.com" ...>`
  - Quick Select Pills:
    - `<button type="button" class="quick-url-pill" data-url="https://gitlab.com">🌐 gitlab.com</button>`
    - `<button type="button" class="quick-url-pill" data-url="https://gitlab.widosoft.com">🏢 gitlab.widosoft.com</button>`
  - Dynamic Token Generation Link:
    - Updates `href` in real-time as user changes the server URL so clicking *"Lấy Access Token tại đây"* immediately opens the correct token page for that server.

### 4.2 Settings Card (`popup/popup.html`)
- Add Server URL display & edit field in the settings card so existing authenticated users can inspect or update their server URL.

### 4.3 Dictionary Additions (`i18n.js`)
Complete Vietnamese and English tokens for:
- `gitlabServerUrlLabel`: "GitLab Server URL:" / "GitLab Server URL:"
- `gitlabServerUrlPlaceholder`: "https://gitlab.com hoặc server riêng..." / "https://gitlab.com or self-hosted server..."
- `invalidServerUrl`: "Vui lòng nhập GitLab Server URL hợp lệ" / "Please enter a valid GitLab Server URL"
- `serverUrlSaved`: "Đã lưu GitLab Server URL thành công" / "GitLab Server URL saved successfully"
- `getTokenHelp`: "Lấy Access Token tại server này" / "Get Access Token from this server"

---

## 5. Chrome Web Store Packaging & Release Pipeline

### 5.1 Extension Metadata (`manifest.json`)
- `"name": "TimeLab"`
- `"version": "1.0.6"`
- `"description": "TimeLab - GitLab KPI, Timesheet & Spent Time Tracker"`
- Host permissions & Permissions strictly aligned with Manifest V3.

### 5.2 Automated Release Script (`scratch/build_release_zip.js`)
- Runs the comprehensive test suite (`scratch/test_full_suite.js`) first.
- If all 11+ test suites pass 100%, bundles production files into `release/timelab-extension-v1.0.6.zip`:
  - Included: `manifest.json`, `background.js`, `content_issue.js`, `content_request.js`, `i18n.js`, `utils.js`, `icon*.png`, `popup/`, `page/`, `todo/`, `note/`.
  - Excluded: `scratch/`, `docs/`, `.git/`, `.superpowers/`, `node_modules/`, `package.json`, markdown notes, temporary logs.

### 5.3 Chrome Web Store Documentation (`docs/CHROME_STORE_SUBMISSION.md`)
- Step-by-step developer dashboard guide.
- Complete Privacy Policy draft (local-first, no tracking, zero third-party data collection).

---

## 6. Testing & Quality Gates

1. **Unit Tests (`scratch/test_gitlab_server_url.js`)**:
   - `sanitizeGitlabUrl` edge cases (trailing slashes, missing protocols, deep paths, spaces, invalid protocols).
   - Dynamic token creation link generation.
   - Dynamic content script registration payload validation.
   - DOM element checks in `popup/popup.html`.
2. **Regression Pipeline Integration**:
   - Registered as Suite 12 in `scratch/test_full_suite.js`.
   - Verified with 12/12 passing suites and 24+ security & syntax checks.
