# Design Document: GitLab Parent Task Child Items Summary Modal

**Document Version:** 1.0.0  
**Date:** 2026-10-01  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Overview & Goal

When working on a parent issue in GitLab (`*://gitlab.widosoft.com/*/-/issues/*`), users frequently need to review their own child tasks and understand their performance (time estimated, time spent, diff, open/closed state, and on-time status).
Currently, users have to open the separate extension Dashboard page (`page/page.html`) to see this information.

### Objectives
1. **Header Action Button ("📊 Tổng hợp task"):**
   - Inject a button directly into the parent issue header, right beside the **Edit** button (`.detail-page-header-actions` or beside `[data-testid="edit-title-button"]`).
   - Uses native GitLab button styling (`btn btn-default btn-sm gl-button`) to match the platform aesthetics.
2. **On-Page Summary Modal:**
   - Clicking the button opens an on-page modal overlay (`#gitlabKpiSummaryModal`) without navigating away from GitLab.
   - Shows quick KPI metric cards (Total tasks, Total Estimate, Total Spent, Diff, On-time rate).
   - Shows detailed table of child tasks assigned to the current user with live Estimate, Spent, Diff, State (Open/Closed), and Timeliness (In-time/Late).
   - Includes a **"➕ Thêm tất cả vào KPI"** button to batch-add all user's child tasks to `WorkItemIds` in storage.
   - Includes a **"🔄 Làm mới"** button to refresh live data via GitLab GraphQL API.
   - Supports keyboard `Escape` dismissal and backdrop click to close.

---

## 2. Architecture & DOM Ingestion

### 2.1 Trigger Button Placement
`content_issue.js` searches for the Edit action button or header action bar:
```javascript
const editBtn = document.querySelector(
    '[data-testid="edit-title-button"], [data-testid="issue-edit-button"], button.js-issuable-edit, .detail-page-header-actions .btn-default, [data-testid="work-item-actions-dropdown"]'
);
```
- If `editBtn` is found, `#kpiSummaryTasksBtn` is inserted immediately adjacent to it (`editBtn.before(btn)` or inside its parent action bar).
- Fallback: Append to `.detail-page-header-actions` or `#tasks > .crud-header`.

### 2.2 Child Tasks Discovery & Filtering
- Scans `ul[data-testid="child-items-container"] > li.tree-item`.
- For each child item:
  - Checks assignee avatar (`div.gl-avatars-inline-child > a`).
  - Matches against current user's profile (`userProfile.web_url`).
  - Extracts task title, URL (`anchor.href`), and work item ID.

### 2.3 Data Fetching & Enrichment
1. **Cache Look-up:** Check `KpiInfo` in `chrome.storage.local`. If tasks already exist, populate immediately.
2. **Live GraphQL Fetch:** For tasks not in cache or on "Làm mới", use GitLab GraphQL API with the user's Access Token to fetch `TIME_TRACKING` (timeEstimate, totalTimeSpent), `START_AND_DUE_DATE` (dueDate), `state`, and `LABELS` (UNPLANNED).
3. **Calculation:**
   - Estimate hours: `timeEstimate / 3600`
   - Spent hours: `totalTimeSpent / 3600`
   - Diff: `Estimate - Spent`
   - On-time evaluation: If closed, compares `closedAt` against `dueDate`.

---

## 3. Modal UI Structure

```html
<div id="gitlabKpiSummaryModal" class="gl-kpi-modal-overlay">
    <div class="gl-kpi-modal-dialog">
        <div class="gl-kpi-modal-header">
            <h3>📊 Tổng hợp Task con của tôi</h3>
            <div class="gl-kpi-header-actions">
                <button id="glKpiAddAllBtn" class="btn btn-sm btn-success">➕ Thêm tất cả vào KPI</button>
                <button id="glKpiRefreshBtn" class="btn btn-sm btn-default">🔄 Làm mới</button>
                <span id="glKpiCloseBtn" class="gl-kpi-close-icon">&times;</span>
            </div>
        </div>
        <div class="gl-kpi-modal-body">
            <!-- Summary Metric Cards -->
            <div class="gl-kpi-summary-grid">
                <div class="gl-kpi-card">...Tổng Task...</div>
                <div class="gl-kpi-card">...Tổng Estimate...</div>
                <div class="gl-kpi-card">...Tổng Spent...</div>
                <div class="gl-kpi-card">...Chênh lệch...</div>
                <div class="gl-kpi-card">...Đúng hạn...</div>
            </div>
            <!-- Detailed Task Table -->
            <div class="gl-kpi-table-wrapper">
                <table class="gl-kpi-table">
                    <thead>...</thead>
                    <tbody id="glKpiTableBody">...</tbody>
                </table>
            </div>
        </div>
    </div>
</div>
```

---

## 4. Verification & Testing Plan
- `scratch/test_content_issue_summary.js`:
  - Test parent button placement resolution logic.
  - Test child task assignee filtering.
  - Test task metric calculations (Estimate, Spent, Diff, On-time rate).
  - Test batch add to `WorkItemIds`.
  - Extension syntax & full regression suite (`scratch/test_full_suite.js`).
