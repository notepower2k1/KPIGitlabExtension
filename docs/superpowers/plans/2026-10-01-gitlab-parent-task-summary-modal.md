# GitLab Parent Task Child Items Summary Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inject a "📊 Tổng hợp task" button beside the Edit button on GitLab parent issues, opening an on-page modal that summarizes all child tasks assigned to the user with KPI metrics (Estimate, Spent, Diff, State, Timeliness) and batch-add capabilities.

**Architecture:** Pure and DOM helper functions in `content_issue.js` with scoped modal styling, GraphQL/cache enrichment, and unit testing via `scratch/test_content_issue_summary.js`.

**Tech Stack:** Vanilla JavaScript (ES2022), DOM API, GitLab GraphQL API, Chrome Storage API (`chrome.storage.local`).

**Spec:** `docs/superpowers/specs/2026-10-01-gitlab-parent-task-summary-modal-design.md`

## Global Constraints
- Manifest V3 compliant: Pure local script execution, no external CDNs or remote resources.
- Native GitLab styling: Match GitLab's design tokens and button styles (`btn btn-default btn-sm gl-button`).
- Zero interference with native GitLab operations (Edit button, issue title, tasks crud tree).
- All 8 existing regression test suites must pass with zero errors.

---

### Task 1: Core Metrics Calculation & Child Task Filtering Logic

**Files:**
- Create: `scratch/test_content_issue_summary.js`
- Modify: `content_issue.js`

**Interfaces:**
- Consumes: Array of task objects with `{ title, href, estimateHour, spentHour, state, isLate, isUnplanned }`
- Produces: Exported pure functions:
  - `calculateChildTaskMetrics(tasks)`
  - `filterMyChildTasks(items, userProfileUrl)`
  - `renderSummaryModalHtml(metrics, tasks, parentTitle)`

- [ ] **Step 1: Write failing unit tests for metric calculation and filtering**

Create `scratch/test_content_issue_summary.js` testing:
- `calculateChildTaskMetrics`:
  - Accurately sums estimate hours and spent hours.
  - Calculates diff (estimate - spent).
  - Counts open vs closed tasks.
  - Computes on-time rate percentage for completed tasks.
- `filterMyChildTasks`:
  - Correctly filters items where assignee URL matches `userProfile.web_url`.
- `renderSummaryModalHtml`:
  - Produces valid modal HTML containing metric cards and task table rows.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch/test_content_issue_summary.js`  
Expected: FAIL with missing functions.

- [ ] **Step 3: Implement calculation and template functions in `content_issue.js`**

Implement `calculateChildTaskMetrics`, `filterMyChildTasks`, and `renderSummaryModalHtml` in `content_issue.js` and export them via `module.exports` when `typeof module !== 'undefined'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_content_issue_summary.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add content_issue.js scratch/test_content_issue_summary.js
git commit -m "feat(gitlab): implement child task metrics calculation and summary modal template"
```

---

### Task 2: Button Injection, Modal Lifecycle & Live GraphQL Integration

**Files:**
- Modify: `content_issue.js`
- Test: `scratch/test_content_issue_summary.js`

**Interfaces:**
- Consumes: Task 1 calculations, GitLab DOM elements (`.detail-page-header-actions`, `[data-testid="edit-title-button"]`)
- Produces:
  - Button `#kpiSummaryTasksBtn` injected beside Edit button
  - Injected CSS styles for `#gitlabKpiSummaryModal` (overlay, dialog, metric cards, table, badges)
  - Modal lifecycle handlers: open, close (`×`, Escape, backdrop click)
  - Data enrichment: reads from `KpiInfo` or calls GraphQL endpoint for live estimate/spent
  - Action `#glKpiAddAllBtn`: batch adds user's child tasks to `WorkItemIds`

- [ ] **Step 1: Add DOM & injection verification tests in `scratch/test_content_issue_summary.js`**

Add tests for:
- Button placement resolution logic (`findEditButtonPlacement`).
- Batch add to storage logic (`batchAddTasksToStorage`).
- CSS style string definition.

- [ ] **Step 2: Run test to verify failure**

Run: `node scratch/test_content_issue_summary.js`  
Expected: FAIL.

- [ ] **Step 3: Implement button injection, modal lifecycle & data enrichment**

In `content_issue.js`:
- Create `injectSummaryButton()`: locates Edit button or header action bar and mounts `#kpiSummaryTasksBtn`.
- Create `openSummaryModal()`: gathers child tasks, enriches data, renders `#gitlabKpiSummaryModal`.
- Inject modal CSS styles (`injectModalStyles()`).
- Attach event handlers for `#glKpiCloseBtn`, `#glKpiRefreshBtn`, `#glKpiAddAllBtn`.
- Support Escape key to close modal.
- Connect to `MutationObserver` so button is mounted even during SPA transitions.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_content_issue_summary.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add content_issue.js scratch/test_content_issue_summary.js
git commit -m "feat(gitlab): inject summary button beside edit and handle modal lifecycle"
```

---

### Task 3: Full Regression Testing & Integration

**Files:**
- Modify: `scratch/test_full_suite.js`

**Interfaces:**
- Consumes: All 8 existing test suites + `scratch/test_content_issue_summary.js`
- Produces: 9/9 passing sub-suites, 18/18 syntax/CSP checks.

- [ ] **Step 1: Add GitLab Summary Modal sub-suite to `scratch/test_full_suite.js`**

Add `runSubSuite('GitLab Parent Task Summary Modal Subsystem', 'scratch/test_content_issue_summary.js');` to `scratch/test_full_suite.js`.

- [ ] **Step 2: Run comprehensive regression test suite**

Run: `node scratch/test_full_suite.js`  
Expected: ALL 9 SUB-SUITES PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add scratch/test_full_suite.js
git commit -m "chore(test): integrate gitlab summary modal suite into full regression pipeline"
```
