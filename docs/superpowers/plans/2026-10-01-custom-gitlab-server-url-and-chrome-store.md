# Custom GitLab Server URL & Chrome Web Store Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to configure any custom GitLab Server URL (GitLab.com and self-hosted instances), dynamically register content scripts, ensure all API and link routing use the dynamic server URL, and automate release packaging for the Chrome Web Store.

**Architecture:** A centralized URL normalizer (`sanitizeGitlabUrl`) standardizes server addresses stored in `chrome.storage.local.gitlabServerUrl`. Popup authentication and options UI provide custom server input with quick-select pills (`gitlab.com`, `gitlab.widosoft.com`) and dynamic token generation links. Background service worker handles dynamic content script registration via `chrome.scripting.registerContentScripts` for custom domains. An automated build script generates clean release zips verifying regression passes.

**Tech Stack:** Vanilla JavaScript (ES2022), Chrome Extension Manifest V3 (`chrome.storage`, `chrome.scripting`, `chrome.alarms`, `chrome.notifications`), Node.js built-in `child_process` and `archiver`/zip bundling.

**Spec:** `docs/superpowers/specs/2026-10-01-custom-gitlab-server-url-and-chrome-store-design.md`

## Global Constraints
- Pure vanilla JavaScript with 100% Manifest V3 CSP compliance (no remote scripts, no eval).
- Default server URL is `https://gitlab.com` when not explicitly configured.
- Static content script matches in `manifest.json` cover `gitlab.com` and `gitlab.widosoft.com`; custom domains are dynamically registered via `chrome.scripting.registerContentScripts`.
- Dictionary parity (100%) between `vi` and `en` in `i18n.js`.
- Zero regressions across existing 11 test suites.

---

### Task 1: Core URL Normalization Utility, Dictionary Tokens & Unit Tests

**Files:**
- Modify: `utils.js`
- Modify: `i18n.js`
- Test: `scratch/test_gitlab_server_url.js`

**Interfaces:**
- Produces:
  - `sanitizeGitlabUrl(rawUrl, defaultUrl = 'https://gitlab.com'): string`
  - `getGitlabServerUrl(storageObj, fallback = 'https://gitlab.com'): Promise<string>`
  - `getTokenGenerationUrl(serverUrl): string`
  - i18n keys: `gitlabServerUrlLabel`, `gitlabServerUrlPlaceholder`, `invalidServerUrl`, `serverUrlSaved`, `getTokenHelp`

- [ ] **Step 1: Write the failing unit tests in `scratch/test_gitlab_server_url.js`**

```javascript
const assert = require('assert');
const utils = require('../utils.js');
const i18n = require('../i18n.js');

console.log('=== Running Suite: GitLab Server URL & Normalizer ===');

// 1. sanitizeGitlabUrl tests
{
    const { sanitizeGitlabUrl } = utils;
    assert.strictEqual(typeof sanitizeGitlabUrl, 'function', 'sanitizeGitlabUrl must be exported');

    // Default fallback
    assert.strictEqual(sanitizeGitlabUrl(''), 'https://gitlab.com');
    assert.strictEqual(sanitizeGitlabUrl(null), 'https://gitlab.com');
    assert.strictEqual(sanitizeGitlabUrl('   '), 'https://gitlab.com');

    // Missing protocol
    assert.strictEqual(sanitizeGitlabUrl('gitlab.com'), 'https://gitlab.com');
    assert.strictEqual(sanitizeGitlabUrl('gitlab.mycorp.vn'), 'https://gitlab.mycorp.vn');

    // Trailing slashes
    assert.strictEqual(sanitizeGitlabUrl('https://gitlab.com/'), 'https://gitlab.com');
    assert.strictEqual(sanitizeGitlabUrl('https://gitlab.mycorp.vn///'), 'https://gitlab.mycorp.vn');

    // Stripping deep paths
    assert.strictEqual(sanitizeGitlabUrl('https://gitlab.com/explore'), 'https://gitlab.com');
    assert.strictEqual(sanitizeGitlabUrl('https://gitlab.widosoft.com/group/project/-/issues'), 'https://gitlab.widosoft.com');

    // Preserving port numbers if present
    assert.strictEqual(sanitizeGitlabUrl('http://192.168.1.50:8080/'), 'http://192.168.1.50:8080');

    console.log('✔ Passed: sanitizeGitlabUrl handles defaults, protocols, slashes, and ports');
}

// 2. getTokenGenerationUrl tests
{
    const { getTokenGenerationUrl } = utils;
    assert.strictEqual(typeof getTokenGenerationUrl, 'function', 'getTokenGenerationUrl must be exported');
    assert.strictEqual(getTokenGenerationUrl('https://gitlab.com'), 'https://gitlab.com/-/user_settings/personal_access_tokens');
    assert.strictEqual(getTokenGenerationUrl('https://gitlab.widosoft.com'), 'https://gitlab.widosoft.com/-/user_settings/personal_access_tokens');
    console.log('✔ Passed: getTokenGenerationUrl formats correct user settings token path');
}

// 3. Dictionary parity check
{
    const dict = i18n.I18N_DICTIONARIES;
    const requiredKeys = [
        'gitlabServerUrlLabel',
        'gitlabServerUrlPlaceholder',
        'invalidServerUrl',
        'serverUrlSaved',
        'getTokenHelp'
    ];
    requiredKeys.forEach(k => {
        assert.ok(dict.vi[k], `Key ${k} must exist in VI dictionary`);
        assert.ok(dict.en[k], `Key ${k} must exist in EN dictionary`);
    });
    console.log('✔ Passed: Dictionary tokens present in both VI and EN');
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch/test_gitlab_server_url.js`
Expected: FAIL (`sanitizeGitlabUrl is not a function`).

- [ ] **Step 3: Implement functions in `utils.js` and dictionary tokens in `i18n.js`**

In `utils.js`:
```javascript
function sanitizeGitlabUrl(rawUrl, defaultUrl = 'https://gitlab.com') {
    if (!rawUrl || typeof rawUrl !== 'string') return defaultUrl;
    let url = rawUrl.trim();
    if (!url) return defaultUrl;

    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    try {
        const parsed = new URL(url);
        return parsed.origin;
    } catch (_) {
        return defaultUrl;
    }
}

function getTokenGenerationUrl(serverUrl) {
    const base = sanitizeGitlabUrl(serverUrl);
    return `${base}/-/user_settings/personal_access_tokens`;
}

async function getGitlabServerUrl(storageArea = null, fallback = 'https://gitlab.com') {
    if (storageArea && storageArea.get) {
        return new Promise(resolve => {
            storageArea.get(['gitlabServerUrl'], res => {
                resolve(sanitizeGitlabUrl(res && res.gitlabServerUrl, fallback));
            });
        });
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const res = await chrome.storage.local.get(['gitlabServerUrl']);
        return sanitizeGitlabUrl(res && res.gitlabServerUrl, fallback);
    }
    return fallback;
}
```
Export in `module.exports` and `window`.
In `i18n.js`: Add required translation keys to `vi` and `en`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_gitlab_server_url.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils.js i18n.js scratch/test_gitlab_server_url.js
git commit -m "feat(url): implement sanitizeGitlabUrl utility and i18n server url tokens"
```

---

### Task 2: Popup Login Screen & Settings Card Integration

**Files:**
- Modify: `popup/popup.html`
- Modify: `popup/popup.css`
- Modify: `popup/popup.js`
- Test: `scratch/test_gitlab_server_url.js`

**Interfaces:**
- Consumes: `sanitizeGitlabUrl`, `getTokenGenerationUrl`, `getGitlabServerUrl` from `utils.js`
- Produces:
  - Elements: `#gitlabServerUrlInput`, `#tokenHelpLink`, `.quick-url-pill`, `#settingsServerUrlInput`, `#saveServerUrlBtn`
  - Reactive sync: updates token help link when server URL changes
  - Persists `gitlabServerUrl` in `chrome.storage.local` upon login and upon saving in settings

- [ ] **Step 1: Add popup UI assertions to `scratch/test_gitlab_server_url.js`**

```javascript
// 4. Popup markup assertions
{
    const fs = require('fs');
    const html = fs.readFileSync('popup/popup.html', 'utf8');
    assert.ok(html.includes('id="gitlabServerUrlInput"'), 'Must have gitlabServerUrlInput');
    assert.ok(html.includes('id="tokenHelpLink"'), 'Must have tokenHelpLink');
    assert.ok(html.includes('data-url="https://gitlab.com"'), 'Must have quick pill for gitlab.com');
    assert.ok(html.includes('data-url="https://gitlab.widosoft.com"'), 'Must have quick pill for gitlab.widosoft.com');
    assert.ok(html.includes('id="settingsServerUrlInput"'), 'Must have settingsServerUrlInput in settings tab');
    console.log('✔ Passed: popup.html contains all required server URL inputs and quick pills');
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch/test_gitlab_server_url.js`
Expected: FAIL.

- [ ] **Step 3: Implement UI and logic in `popup/`**

1. In `popup/popup.html`:
   - Add Server URL group above token input on `#login-screen` with quick pills:
     `<button type="button" class="quick-url-pill" data-url="https://gitlab.com">🌐 gitlab.com</button>`
     `<button type="button" class="quick-url-pill" data-url="https://gitlab.widosoft.com">🏢 gitlab.widosoft.com</button>`
   - Link `#tokenHelpLink` with `target="_blank"`.
   - Add Server URL row in `#settings-tab`.
2. In `popup/popup.css`:
   - Style `.quick-url-pills`, `.quick-url-pill`, `.quick-url-pill.active`.
3. In `popup/popup.js`:
   - Load stored `gitlabServerUrl` on init (default `https://gitlab.com`).
   - Listen to input changes on `#gitlabServerUrlInput` to update `#tokenHelpLink.href = getTokenGenerationUrl(val)`.
   - Wire quick-pill clicks to set value and update link.
   - On login click: sanitize URL, call `${serverUrl}/api/v4/user` to validate token, and save `gitlabServerUrl` in storage.
   - In settings: save updated Server URL and display confirmation.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_gitlab_server_url.js`
Run: `node -c popup/popup.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add popup/popup.html popup/popup.css popup/popup.js scratch/test_gitlab_server_url.js
git commit -m "feat(popup): add gitlab server url input with quick pills and dynamic token link"
```

---

### Task 3: Background Service Worker Dynamic Content Script Registration & API Routing

**Files:**
- Modify: `background.js`
- Modify: `manifest.json`
- Modify: `page/page.js`
- Modify: `content_issue.js`
- Test: `scratch/test_gitlab_server_url.js`

**Interfaces:**
- Consumes: `sanitizeGitlabUrl` from `utils.js`
- Produces:
  - `syncDynamicContentScript(serverUrl): Promise<boolean>` in `background.js`
  - Dynamic API queries in `background.js` (`${serverUrl}/api/v4/issues`)
  - Dynamic GraphQL queries in `page/page.js` (`${serverUrl}/api/graphql`)
  - Fallback in `content_issue.js` prioritizing `window.location.origin`

- [ ] **Step 1: Add dynamic script registration tests to `scratch/test_gitlab_server_url.js`**

```javascript
// 5. Background script dynamic registration logic
{
    const bg = require('../background.js');
    assert.strictEqual(typeof bg.syncDynamicContentScript, 'function', 'syncDynamicContentScript must be exported');

    // Test with mock chrome.scripting
    let registeredScripts = [];
    let unregisteredIds = [];
    global.chrome = {
        scripting: {
            registerContentScripts: async (scripts) => { registeredScripts.push(...scripts); },
            unregisterContentScripts: async (filter) => { unregisteredIds.push(...filter.ids); }
        }
    };

    // 1. Static domain: gitlab.com -> should unregister dynamic script
    await bg.syncDynamicContentScript('https://gitlab.com');
    assert.ok(unregisteredIds.includes('custom-gitlab-scripts'));

    // 2. Custom domain: gitlab.acme.corp -> should register
    unregisteredIds = [];
    await bg.syncDynamicContentScript('https://gitlab.acme.corp');
    assert.strictEqual(registeredScripts.length, 1);
    assert.strictEqual(registeredScripts[0].id, 'custom-gitlab-scripts');
    assert.ok(registeredScripts[0].matches.includes('https://gitlab.acme.corp/*/-/issues/*'));

    console.log('✔ Passed: syncDynamicContentScript registers custom domains and cleans static domains');
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch/test_gitlab_server_url.js`
Expected: FAIL.

- [ ] **Step 3: Implement background dynamic script registration and update all API callers**

1. In `background.js`:
   - Implement `syncDynamicContentScript(serverUrl)`.
   - Listen to `chrome.storage.onChanged` for `changes.gitlabServerUrl`.
   - Update `checkUnaddedKpiTasksReminder` to use `gitlabUrl` from storage.
2. In `manifest.json`:
   - Add `*://gitlab.com/*/-/issues/*`, `*://gitlab.com/*/-/work_items/*`, `*://gitlab.com/*/-/merge_requests/*` to `content_scripts`.
   - Bump version to `1.0.6`.
   - Set description to `"TimeLab - GitLab KPI, Timesheet & Spent Time Tracker"`.
3. In `page/page.js`:
   - Retrieve `gitlabServerUrl` from storage (default `https://gitlab.com`).
   - Replace hardcoded `https://gitlab.widosoft.com` in lines 3209, 3468, 3594, 3678 with dynamic `gitlabServerUrl`.
4. In `content_issue.js`:
   - Replace fallback hardcoded URLs with `window.location.origin + '/api/graphql'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_gitlab_server_url.js`
Run: `node -c background.js page/page.js content_issue.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add background.js manifest.json page/page.js content_issue.js scratch/test_gitlab_server_url.js
git commit -m "feat(gitlab): implement dynamic content script registration and dynamic api routing"
```

---

### Task 4: Store Build Script, Privacy Policy & Full Regression Integration

**Files:**
- Create: `scratch/build_release_zip.js`
- Create: `docs/CHROME_STORE_SUBMISSION.md`
- Modify: `scratch/test_full_suite.js`

**Interfaces:**
- Produces:
  - Suite 12 in `scratch/test_full_suite.js`
  - Runnable release packager: `node scratch/build_release_zip.js`
  - Release artifact: `release/timelab-extension-v1.0.6.zip`
  - Complete submission guide and privacy policy: `docs/CHROME_STORE_SUBMISSION.md`

- [ ] **Step 1: Create `scratch/build_release_zip.js`**

Implement automated packaging script using Node.js built-ins (`fs`, `path`, `child_process`) that:
1. Runs `node scratch/test_full_suite.js` as a pre-build gate.
2. If tests pass, creates `release/` directory.
3. Packages only production files:
   - `manifest.json`, `background.js`, `content_issue.js`, `content_request.js`, `i18n.js`, `utils.js`
   - `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
   - `popup/` (`popup.html`, `popup.css`, `popup.js`)
   - `page/` (`page.html`, `page.css`, `page.js`, `chart.umd.min.js`, `exceljs.min.js`)
   - `todo/` (`todo.html`, `todo.css`, `todo.js`)
   - `note/` (`note.html`, `note.css`, `note.js`)
4. Uses PowerShell `Compress-Archive` or zip command on Windows without external dependencies.
5. Verifies zip size and prints summary.

- [ ] **Step 2: Create `docs/CHROME_STORE_SUBMISSION.md`**

Write complete developer submission documentation:
- Store Title, Summary, and Detailed Description (Markdown and plain text).
- Category, Language, and Maturity rating.
- Single-Purpose description: "GitLab productivity, KPI assessment, timesheet audit, and spent time tracking".
- Permissions Justification table (Storage, Alarms, Notifications, Scripting, Tabs, Host Permissions).
- Complete Privacy Policy declaration (Local-first, zero third-party telemetry, private token encrypted in user storage).
- Step-by-step submission guide on Chrome Developer Dashboard.

- [ ] **Step 3: Register Suite 12 in `scratch/test_full_suite.js`**

Add `scratch/test_gitlab_server_url.js` as Suite 12 in `runSubSuite`.
Add element assertions for `serverUrlInput` and `quick-url-pill` in `popup/popup.html`.

- [ ] **Step 4: Run full regression suite & release packager**

Run: `node scratch/test_full_suite.js` (Must pass 12/12 sub-suites and all syntax/security checks).
Run: `node scratch/build_release_zip.js` (Must produce valid `release/timelab-extension-v1.0.6.zip`).

- [ ] **Step 5: Commit**

```bash
git add scratch/build_release_zip.js docs/CHROME_STORE_SUBMISSION.md scratch/test_full_suite.js
git commit -m "chore(release): add automated store build packager and submission guide"
```
