# Chrome Web Store Submission Guide & Privacy Policy: TimeLab

This document contains the complete metadata, single-purpose declaration, reviewer permission justifications, privacy policy, and step-by-step submission walkthrough for publishing **TimeLab** on the Google Chrome Web Store.

---

## 1. Store Listing Metadata

### General Info
- **Extension Name:** `TimeLab - GitLab KPI, Timesheet & Spent Time Tracker`
- **Short Name:** `TimeLab`
- **Current Version:** `1.0.6`
- **Primary Category:** `Productivity`
- **Secondary Category:** `Developer Tools`
- **Primary Language:** `English` (with built-in Vietnamese & English runtime toggle)
- **Pricing:** `Free`

### Summary / Short Description (Maximum 132 characters)
> `Track GitLab timesheets, calculate monthly developer KPIs, audit daily spent time, manage tasks with Kanban & smart alarms.`
*(Exact length: 124 characters)*

---

### Detailed Description (Plain Text - Copy & Paste directly into Chrome Web Store Console)

```text
TimeLab is an all-in-one developer productivity suite built specifically for software engineers and project teams working on GitLab. Seamlessly track timesheets, calculate monthly KPI performance, audit spent time against estimates, and streamline your daily workflow across both public GitLab.com and private self-hosted GitLab instances.

KEY CAPABILITIES:

1. COMPREHENSIVE TIMESHEET & DAILY AUDIT
• Visual monthly calendar grid showing daily spent time vs. working hours (8h standard).
• Instant detection of missed or under-logged days with color-coded status indicators.
• Support for 1-day and 0.5-day annual leave or holidays to keep KPI percentages accurate.
• One-click export of timesheets and KPI performance reports to formatted Excel spreadsheets (.xlsx).

2. ADVANCED KPI & PERFORMANCE ANALYTICS
• Automated KPI percentage calculation combining task estimation accuracy, delivery velocity, and total logged hours.
• Monthly visual charts: Weekly Spent vs. Estimated hours, Task Type distribution, Task Status breakdown, and KPI trend charts.
• Offline vendor libraries (Chart.js & ExcelJS) ensure instant rendering without remote dependencies or external tracking.

3. IN-PAGE GITLAB ISSUE SUMMARY MODAL
• Directly injects a lightweight "KPI Summary" button into GitLab Issue, Work Item, and Merge Request pages.
• Displays real-time child task progress, assignee breakdown, total spent time, and overdue alerts right inside GitLab.
• Fast toggle to include or exclude specific child tasks from your monthly KPI calculations.

4. END-OF-DAY UNADDED TASKS REMINDER
• Automatic background scan before your shift ends to detect tasks you created or worked on today that are not yet added to your KPI list.
• Native desktop notification and badge alerts ensure you never miss logging your daily work before clocking out.

5. INTEGRATED KANBAN TO-DO & STICKY NOTEPAD
• Drag-and-drop Kanban board (To Do, In Progress, Review, Done) to manage daily priorities.
• Multi-tab markdown-enabled Sticky Notepad for quick code snippets, meeting minutes, and scratchpads.
• Open boards and notes in a popup modal, standalone browser tab, or separate desktop window.

6. WORKDAY CHECK-IN & CHECK-OUT ALARMS
• Configurable workday reminders (Monday to Friday) for morning check-in and evening check-out.
• Customizable alarm sounds and quick links to your company's attendance or time-tracking portal.

7. FULL SUPPORT FOR PUBLIC & SELF-HOSTED GITLAB
• Works seamlessly with gitlab.com and custom enterprise/on-premise GitLab domains (e.g., gitlab.company.com).
• Dynamic content script registration enables in-page features on your custom domains with zero configuration.

PRIVACY & SECURITY FIRST:
• 100% Local-First Architecture: All data, settings, notes, and tasks stay on your local computer.
• Zero Telemetry: No analytics, no user tracking, no third-party servers, and zero remote scripts.
• Direct Communication: API calls connect directly and exclusively between your browser and your designated GitLab instance using your Personal Access Token.
```

---

### Detailed Description (Markdown Format for Repository & Docs)

```markdown
# TimeLab - GitLab KPI, Timesheet & Spent Time Tracker

**TimeLab** is an all-in-one developer productivity suite built specifically for software engineers and project teams working on GitLab. Seamlessly track timesheets, calculate monthly KPI performance, audit spent time against estimates, and streamline your daily workflow across both public **GitLab.com** and **self-hosted GitLab** instances.

### 🌟 Key Capabilities

#### 1. Comprehensive Timesheet & Daily Audit
- **Visual Monthly Calendar Grid:** Daily spent time vs. working hours (8h standard).
- **Audit Indicators:** Instant visual detection of missed, under-logged, or overtime days.
- **Leave Day Management:** Support for full-day and half-day (0.5-day) annual leave or holidays.
- **Excel Export:** One-click export of timesheets and KPI performance reports to formatted `.xlsx` spreadsheets.

#### 2. Advanced KPI & Performance Analytics
- **Automated KPI Scores:** Calculates real-time KPI performance based on estimation accuracy, completion velocity, and logged hours.
- **Visual Charts:** Interactive monthly charts (Weekly Spent vs. Estimated hours, Task Types, Status breakdown, KPI Trends).
- **100% Offline Libraries:** Chart.js and ExcelJS are bundled locally inside the extension.

#### 3. In-Page GitLab Issue Summary Modal
- **In-Page Injection:** Injects a "KPI Summary" button into GitLab Issue, Work Item, and Merge Request pages.
- **Live Hierarchy Progress:** Real-time child task progress, assignee breakdown, total spent time, and overdue task alerts.
- **Quick Include/Exclude:** Toggle child tasks in or out of your monthly KPI with a single click.

#### 4. End-of-Day Unadded Tasks Reminder
- **Automated Scan:** Automatically checks for tasks created or updated today that haven't been added to your KPI sheet.
- **Desktop Alerts:** Gentle notifications and badge alerts before your shift ends so no work goes unlogged.

#### 5. Integrated Kanban To-Do & Sticky Notepad
- **Drag-and-Drop Kanban Board:** Organize tasks into To Do, In Progress, Review, and Done.
- **Multi-Tab Notepad:** Local markdown notes for meeting summaries, code snippets, and daily logs.
- **Dual-Mode Display:** Use tools inside the extension popup, in a full tab, or in an independent desktop window.

#### 6. Workday Check-In & Check-Out Alarms
- **Workday Automation:** Morning and evening workday alerts (Monday - Friday).
- **Quick Attendance Link:** Configurable direct link to your organization's attendance portal.

#### 7. Full Support for Public & Self-Hosted GitLab
- Supports both `gitlab.com` and enterprise on-premise GitLab CE/EE installations (e.g. `gitlab.mycompany.com`).
- Dynamic content script registration activates in-page features on any custom GitLab domain without code modifications.
```

---

## 2. Store Assets & Visual Media Requirements

| Asset Type | Dimensions | Required Format | Description / Location |
| :--- | :--- | :--- | :--- |
| **Extension Icon** | 128x128 px | PNG (transparent background) | `icon128.png` in project root |
| **Small Promo Tile** | 440x280 px | PNG or JPEG | High-contrast branding with TimeLab logo & subtitle |
| **Marquee Promo Tile** | 1400x560 px (or responsive) | JPEG | Hero banner featuring dashboard mockup, popup, modal and key value propositions (`thumb.jpg` / `docs/store-assets/thumb.jpg`) |
| **Screenshot 1** | 1280x800 px | PNG | Monthly KPI Dashboard & Work Items (`docs/store-assets/screenshot1_dashboard_1280x800.png` / `ui1_1280x800.png`) |
| **Screenshot 2** | 1280x800 px | PNG | Monthly Analytics, KPI Cards & Timesheet Grid (`docs/store-assets/screenshot2_analytics_1280x800.png` / `ui2_1280x800.png`) |
| **Screenshot 3** | 1280x800 px | PNG | GitLab Issue Page with Injected Sub-Tasks Summary Modal (`docs/store-assets/screenshot3_modal_1280x800.png` / `ui3_1280x800.png`) |

---

## 3. Single-Purpose Policy Declaration

**Chrome Web Store Single-Purpose Requirement:**
*"An extension must have a single purpose that is narrow and easy to understand."*

### Official Single-Purpose Statement:
> **"TimeLab has a single purpose: enabling software developers and project teams using GitLab to audit daily spent time, evaluate monthly performance against KPI targets, and maintain accurate work logs within their GitLab development workflow."**
>
> All integrated features—including timesheet aggregation, monthly KPI calculation, issue summary modals, local kanban task management, and workday reminders—directly support the core purpose of work tracking, time compliance, and transparent developer performance evaluation on GitLab.

---

## 4. Permissions Justification (For Chrome Reviewers)

When filling out the **Privacy practices** tab in the Chrome Developer Dashboard, use the exact justifications below:

| Permission | Chrome Reviewer Justification |
| :--- | :--- |
| **`storage`** | Required to store user settings, the user's GitLab Personal Access Token, configured GitLab server URL, leave day records, local sticky notes, and Kanban to-do items locally on the device using `chrome.storage.local`. No user data is ever transmitted to external servers. |
| **`alarms`** | Required to schedule background checks for morning check-in and evening check-out alerts, as well as the end-of-day reminder that scans for tasks created today that have not yet been added to the user's KPI sheet. |
| **`notifications`** | Required to display native desktop notifications reminding developers to check in, check out, or log time on unadded GitLab tasks before leaving work. |
| **`scripting`** | Required to dynamically register and unregister content scripts on custom, enterprise, or self-hosted GitLab domains entered by the user in settings, enabling the in-page KPI summary button without requiring extension updates. |
| **Static Host Permissions (`gitlab.com`, `gitlab.widosoft.com`)** | Required to perform REST API (`/api/v4/issues`, `/api/v4/user`) and GraphQL API queries against standard GitLab Cloud (`gitlab.com`) and on-premise instances to fetch task metrics, spent hours, and timesheets. |
| **Optional Host Permissions (`https://*/*`, `http://*/*`)** | **Least Privilege Justification:**<br>Rather than requesting broad `<all_urls>` permission statically, TimeLab strictly requests runtime host permission (`chrome.permissions.request`) ONLY when the user explicitly enters and saves an on-premise or enterprise self-hosted GitLab server URL (e.g. `gitlab.company.corp`, `git.internal.net`, `192.168.x.x`).<br><br>**Security Guarantee:** The extension prompts the user via Chrome's native permission modal for that specific server origin only, and never intercepts or accesses any unrelated third-party websites. |

---

## 5. Complete Privacy Policy Draft

*(Host this policy at a publicly accessible URL, e.g. on GitHub Pages, GitLab Pages, or a personal website, and paste the URL into the Chrome Web Store Console.)*

```markdown
# Privacy Policy for TimeLab Chrome Extension

**Last Updated:** October 1, 2026  
**Effective Date:** October 1, 2026

TimeLab ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains our practices regarding data collection, usage, and disclosure when you use the TimeLab Chrome Extension.

### 1. 100% Local-First Architecture
TimeLab is designed from the ground up as a **local-first** application. All data processing, metric calculations, timesheet audits, and note/task storage occur exclusively on your local device within your web browser.

### 2. Information We Do NOT Collect
- We do **NOT** collect, store, transmit, or sell any personal information.
- We do **NOT** use tracking cookies, analytics SDKs (e.g. Google Analytics), error reporting services (e.g. Sentry), or external telemetry tools.
- We do **NOT** operate any remote backend servers or databases that receive your data.
- We do **NOT** log or monitor your web browsing activity.

### 3. Handling of Authentication Credentials
- To interact with GitLab, TimeLab requires a Personal Access Token provided by you.
- Your Personal Access Token is saved strictly in your browser's local storage (`chrome.storage.local`).
- Your token is **only** used to authenticate HTTPS requests directly between your browser and your configured GitLab server (e.g., `gitlab.com` or your company's self-hosted GitLab instance).
- Your token is **never** sent to any third party, developer server, or external service.

### 4. Permissions Usage
- **Storage:** Persists your settings, token, cached issue IDs, notes, and to-do lists locally.
- **Alarms & Notifications:** Schedules and displays local alerts for check-in/out and end-of-day KPI task reminders.
- **Scripting & Host Permissions (`<all_urls>`):** Enables in-page features (such as the KPI Summary button) on public `gitlab.com` as well as user-specified enterprise self-hosted GitLab domains. Network requests are made strictly and exclusively to the user-configured GitLab server URL.
- **Tabs:** Opens the TimeLab full-screen dashboard, Kanban window, and notepad tabs.

### 5. Third-Party Libraries
All vendor libraries used by TimeLab (specifically Chart.js and ExcelJS) are packaged offline inside the extension. The extension makes **zero** calls to remote Content Delivery Networks (CDNs) or external script providers.

### 6. User Rights & Data Control
You maintain complete control over your data:
- You can export all your local tasks and settings to a JSON file at any time.
- You can import previously saved data.
- You can immediately delete your token and session data by clicking the "Log out" button in the extension popup.
- Uninstalling TimeLab from Google Chrome permanently deletes all extension data stored on your device.

### 7. Changes to This Privacy Policy
We may update this Privacy Policy from time to time. Any changes will be posted in this repository and updated in the Chrome Web Store listing.

### 8. Contact Us
If you have any questions or concerns regarding this Privacy Policy or the security practices of TimeLab, please open an issue on our official GitHub repository or contact the developer at:
- **Developer:** notepower2k1
- **Email:** contact.notepower2k1@gmail.com
```

---

## 6. Chrome Web Store Developer Dashboard Walkthrough

Follow these step-by-step instructions to publish the extension:

### Step 1: Generate the Release Package
From your repository root, run the automated release packager:
```bash
node scratch/build_release_zip.js
```
The script will:
1. Run all 12 regression test suites and 23 security/syntax validations.
2. Stage only production files (excluding `scratch/`, `docs/`, `.git/`, markdown files).
3. Generate the distribution archive at `release/timelab-extension-v1.0.6.zip`.
4. Verify package integrity and display archive size (~1.0 MB).

### Step 2: Open Chrome Web Store Developer Dashboard
1. Navigate to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Log in with your Google Developer account (pay the one-time $5 registration fee if this is your first extension).

### Step 3: Upload the Package
1. Click the **"New Item"** button at the top-right.
2. Drag and drop `release/timelab-extension-v1.0.6.zip` (or browse to `D:\CodingTime\KPIGitlabExtension\release\timelab-extension-v1.0.6.zip`).
3. The dashboard will parse `manifest.json` and create the draft item.

### Step 4: Fill Store Listing Details
1. **Title:** `TimeLab - GitLab KPI, Timesheet & Spent Time Tracker`
2. **Summary:** Copy from Section 1 above.
3. **Description:** Copy the plain text description from Section 1 above.
4. **Icons & Media:**
   - Upload `icon128.png` as the store icon.
   - Upload the promotional tile images and at least 3 screenshots (1280x800 recommended).
5. **Category:** Select `Productivity` (and `Developer Tools` if secondary category is requested).
6. **Language:** Select `English` (the UI will adapt to Vietnamese or English based on user settings).

### Step 5: Complete Privacy Practices Tab
1. **Single Purpose:** Paste the single-purpose statement from Section 3.
2. **Permission Justifications:** Copy each entry from the Permission Justification Table in Section 4.
3. **Host Permission Justification (`<all_urls>`):** Paste the detailed justification from Section 4 explaining self-hosted GitLab support.
4. **Data Usage Disclosures:**
   - Check **"No"** to all data collection options (TimeLab does NOT collect user data).
   - Check the compliance certification checkbox.
5. **Privacy Policy URL:** Paste your hosted Privacy Policy URL (from Section 5).

### Step 6: Distribution Settings
1. **Visibility:** Select `Public` (or `Unlisted` for internal beta testing).
2. **Regions:** Select `All regions` (or target regions).

### Step 7: Submit for Review
1. Click **"Submit for Review"**.
2. **Review Timeline:**
   - Because Manifest V3 and `<all_urls>` are declared with detailed justifications, reviews typically take between **24 to 72 hours**.
3. Once approved, the extension will be live on the Chrome Web Store!
