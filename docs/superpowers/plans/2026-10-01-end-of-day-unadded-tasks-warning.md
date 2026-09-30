# End-of-Day Unadded WorkItems Warning Subsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated end-of-day scanner that identifies work items created by the user today on GitLab that have not yet been added to KPI, prompting the user via desktop notifications, an extension action badge, and an interactive warning banner on the popup with 1-click batch add.

**Architecture:** A lightweight scheduler in `background.js` checks every minute against `checkOutTime - kpiReminderMinutesBefore`. When triggered, it queries GitLab REST API `/api/v4/issues` for tasks created today by the current user, diffs with `WorkItemIds` using pure helpers in `utils.js`, alerts the user via desktop notifications + action badge, and saves `UnaddedTodayTasks`. `popup/` renders an amber warning banner with 1-click batch add to immediately persist them into `WorkItemIds` and clear the warning.

**Tech Stack:** Vanilla JavaScript (ES6+), Manifest V3 Service Worker, Chrome Alarms & Notifications, Chrome Storage API, GitLab REST API v4, HTML5/CSS3.

**Spec:** [`docs/superpowers/specs/2026-10-01-end-of-day-unadded-tasks-warning-design.md`](file:///D:/CodingTime/KPIGitlabExtension/docs/superpowers/specs/2026-10-01-end-of-day-unadded-tasks-warning-design.md)

## Global Constraints
- Manifest V3 CSP compliance: 100% local JavaScript, zero remote scripts or CDNs, zero eval.
- Date isolation: strictly filter tasks created today (`created_at >= 00:00:00` local time).
- Authorship & State: strictly query tasks authored by user (`scope=created_by_me`), `state=opened`.
- Backward compatibility: preserve existing `WorkItemIds` storage format and `check-in/check-out` alert system.
- Zero infinite loops, anti-spam rate limiting (max notifications per day, non-workday bypass).

---

### Task 1: Core Utilities, Date Bound, & State Evaluator

**Files:**
- Create: `scratch/test_unadded_tasks_warning.js`
- Modify: `utils.js`

**Interfaces:**
- Consumes: `isWorkday(date)` from `background.js` or `utils.js`, `isTaskInList(list, item)` from `utils.js`/`content_issue.js`.
- Produces:
  - `getTodayStartIso(now?: Date): string`
  - `filterUnaddedTasks(apiIssues: Array, storedWorkItems: Array): Array`
  - `evaluateKpiReminderState(now: Date, settings: Object, state: Object): { shouldScan: boolean, shouldNotify: boolean, nextState: Object }`
  - `fetchTodayCreatedIssues(token: string, baseUrl: string, todayIso: string, fetchFn?: Function): Promise<Array>`

- [ ] **Step 1: Write the failing unit tests for utilities & evaluator**

Create `scratch/test_unadded_tasks_warning.js` with comprehensive assertions for `getTodayStartIso`, `filterUnaddedTasks`, `evaluateKpiReminderState`, and `fetchTodayCreatedIssues`.

```javascript
const assert = require('assert');

console.log('--- Running Unadded WorkItems Warning Unit Tests ---');

let utilsModule;
try {
    utilsModule = require('../utils.js');
} catch (e) {
    console.error('Cannot import utils.js:', e.message);
}

const {
    getTodayStartIso,
    filterUnaddedTasks,
    evaluateKpiReminderState,
    fetchTodayCreatedIssues
} = utilsModule || {};

// 1. Function existence
assert.strictEqual(typeof getTodayStartIso, 'function');
assert.strictEqual(typeof filterUnaddedTasks, 'function');
assert.strictEqual(typeof evaluateKpiReminderState, 'function');
assert.strictEqual(typeof fetchTodayCreatedIssues, 'function');

// 2. getTodayStartIso returns ISO string representing 00:00:00.000 local time
const testDate = new Date(2026, 9, 1, 15, 30, 0); // 2026-10-01 15:30
const todayIso = getTodayStartIso(testDate);
const parsedMidnight = new Date(todayIso);
assert.strictEqual(parsedMidnight.getFullYear(), 2026);
assert.strictEqual(parsedMidnight.getMonth(), 9);
assert.strictEqual(parsedMidnight.getDate(), 1);
assert.strictEqual(parsedMidnight.getHours(), 0);
assert.strictEqual(parsedMidnight.getMinutes(), 0);
assert.strictEqual(parsedMidnight.getSeconds(), 0);

// 3. filterUnaddedTasks
const mockApiIssues = [
    { id: 101, iid: 11, title: 'Task 1', web_url: 'https://gitlab.com/grp/prj/-/issues/11', created_at: '2026-10-01T08:00:00Z' },
    { id: 102, iid: 12, title: 'Task 2', web_url: 'https://gitlab.com/grp/prj/-/issues/12', created_at: '2026-10-01T09:00:00Z' },
    { id: 103, iid: 13, title: 'Task 3', web_url: 'https://gitlab.com/grp/prj/-/work_items/13', created_at: '2026-10-01T10:00:00Z' }
];

const mockStored = [
    { id: '11', href: 'https://gitlab.com/grp/prj/-/issues/11' },
    { id: 'legacy-id', href: 'https://gitlab.com/grp/prj/-/work_items/13' }
];

const unadded = filterUnaddedTasks(mockApiIssues, mockStored);
assert.strictEqual(unadded.length, 1);
assert.strictEqual(unadded[0].id, '102');
assert.strictEqual(unadded[0].title, 'Task 2');
assert.deepStrictEqual(filterUnaddedTasks([], []), []);
assert.deepStrictEqual(filterUnaddedTasks(null, null), []);

// 4. evaluateKpiReminderState
// A. Weekend (Saturday): should not scan or notify
const saturday = new Date('2026-10-03T17:45:00');
const satResult = evaluateKpiReminderState(saturday, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, {});
assert.strictEqual(satResult.shouldScan, false);
assert.strictEqual(satResult.shouldNotify, false);

// B. Weekday before reminder time (e.g. 17:30 with 15 mins before 18:00): should not scan
const thursdayEarly = new Date('2026-10-01T17:30:00');
const earlyResult = evaluateKpiReminderState(thursdayEarly, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, {});
assert.strictEqual(earlyResult.shouldScan, false);

// C. Weekday at reminder window (17:45): should scan and notify
const thursdayTrigger = new Date('2026-10-01T17:45:00');
const triggerResult = evaluateKpiReminderState(thursdayTrigger, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, {});
assert.strictEqual(triggerResult.shouldScan, true);
assert.strictEqual(triggerResult.shouldNotify, true);
assert.strictEqual(triggerResult.nextState.count, 1);

// D. Already notified max times (e.g. count >= 2): should scan for UI refresh but should not dispatch sound/notification spam
const stateNotified = { lastDate: '2026-10-01', count: 2, done: false, lastNotified: thursdayTrigger.toISOString() };
const repeatResult = evaluateKpiReminderState(new Date('2026-10-01T17:50:00'), { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, stateNotified);
assert.strictEqual(repeatResult.shouldNotify, false);

// E. Feature disabled: should not scan or notify
const disabledResult = evaluateKpiReminderState(thursdayTrigger, { enabled: false, checkOutTime: '18:00', minutesBefore: 15 }, {});
assert.strictEqual(disabledResult.shouldScan, false);

// 5. fetchTodayCreatedIssues network mock
const mockFetch = async (url, opts) => {
    assert.ok(url.includes('scope=created_by_me'));
    assert.ok(url.includes('state=opened'));
    assert.ok(url.includes('created_after='));
    return {
        ok: true,
        json: async () => [
            { id: 999, iid: 99, title: 'Mock Issue', web_url: 'https://gitlab.com/issue/99' }
        ]
    };
};

(async () => {
    const fetched = await fetchTodayCreatedIssues('token123', 'https://gitlab.com', '2026-10-01T00:00:00.000Z', mockFetch);
    assert.strictEqual(fetched.length, 1);
    assert.strictEqual(fetched[0].id, '999');
    console.log('✔ Task 1 assertions passed!');
})();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch/test_unadded_tasks_warning.js`
Expected: FAIL with "getTodayStartIso is not a function"

- [ ] **Step 3: Implement functions in `utils.js`**

Implement:
1. `getTodayStartIso(now = new Date())`
2. `filterUnaddedTasks(apiIssues, storedWorkItems)`
3. `evaluateKpiReminderState(now, settings, state = {})`
4. `fetchTodayCreatedIssues(token, baseUrl, todayStartIso, customFetch = (typeof fetch !== 'undefined' ? fetch : null))`
5. Export in `module.exports` and bind to `window` if in browser.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_unadded_tasks_warning.js`
Expected: PASS with "✔ Task 1 assertions passed!"

- [ ] **Step 5: Syntax validation & Commit**

Run: `node -c utils.js`
Commit:
```bash
git add utils.js scratch/test_unadded_tasks_warning.js
git commit -m "feat(kpi): implement core unadded tasks filter and reminder evaluator"
```

---

### Task 2: Background Service Worker Scheduler, Alarm & Notification Routing

**Files:**
- Modify: `background.js`
- Test: `scratch/test_unadded_tasks_warning.js`

**Interfaces:**
- Consumes: `getTodayStartIso`, `filterUnaddedTasks`, `evaluateKpiReminderState`, `fetchTodayCreatedIssues` from `utils.js`.
- Produces:
  - `checkUnaddedKpiTasksReminder(now?: Date): Promise<void>`
  - Updated `handleNotificationClick(notifId)` handling `kpi-unadded-alert`.
  - Notification `kpi-unadded-alert` and badge `'!'` with background `#f59e0b`.

- [ ] **Step 1: Write integration test assertions in `scratch/test_unadded_tasks_warning.js`**

Add tests for:
1. `checkUnaddedKpiTasksReminder` execution with mock storage and mock fetch.
2. Verification of `UnaddedTodayTasks` storage update and `chrome.notifications.create` invocation.
3. Verification of badge setting (`setBadgeText`, `setBadgeBackgroundColor`).
4. `handleNotificationClick('kpi-unadded-alert')` clearing notification and opening `popup.html` or active tab.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch/test_unadded_tasks_warning.js`
Expected: FAIL (missing `checkUnaddedKpiTasksReminder`)

- [ ] **Step 3: Implement scheduler in `background.js`**

1. Import/include `getTodayStartIso`, `filterUnaddedTasks`, `evaluateKpiReminderState`, `fetchTodayCreatedIssues` (or define in `background.js` / load from `utils.js`).
2. Add `checkUnaddedKpiTasksReminder()`:
   - Reads `AccessToken`, `gitlabUrl`, `checkOutTime`, `checkOutEnabled`, `kpiReminderEnabled`, `kpiReminderMinutesBefore`, `kpiReminderState`, `WorkItemIds`.
   - Calls `evaluateKpiReminderState(now, settings, state)`.
   - If `shouldScan`: calls `fetchTodayCreatedIssues`, diffs with `WorkItemIds` via `filterUnaddedTasks`.
   - If unadded tasks found:
     - Stores `UnaddedTodayTasks`.
     - Dispatches notification `kpi-unadded-alert` if `shouldNotify`.
     - Sets badge `'!'` and color `#f59e0b`.
   - If no unadded tasks:
     - Clears `UnaddedTodayTasks`.
     - Clears badge `setBadgeText({ text: '' })`.
3. In `onAlarm`: call `await checkUnaddedKpiTasksReminder();`.
4. In `onInstalled`: register defaults `kpiReminderEnabled: true`, `kpiReminderMinutesBefore: 15`.
5. In `handleNotificationClick`: handle `'kpi-unadded-alert'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_unadded_tasks_warning.js`
Expected: PASS

- [ ] **Step 5: Syntax check & Commit**

Run: `node -c background.js`
Commit:
```bash
git add background.js scratch/test_unadded_tasks_warning.js
git commit -m "feat(kpi): add background scheduler, desktop alert, and badge for unadded tasks"
```

---

### Task 3: Popup Extension Warning Banner, Task List & 1-Click Batch Add

**Files:**
- Modify: `popup/popup.html`
- Modify: `popup/popup.css`
- Modify: `popup/popup.js`
- Test: `scratch/test_unadded_tasks_warning.js`

**Interfaces:**
- Consumes: `UnaddedTodayTasks`, `WorkItemIds` in `chrome.storage.local`.
- Produces:
  - Interactive `#unaddedKpiBanner` with batch-add and individual task-add handlers.
  - User settings toggles `#kpiReminderEnabledInput` and `#kpiReminderMinutesInput`.

- [ ] **Step 1: Write DOM & UI tests in `scratch/test_unadded_tasks_warning.js`**

Add tests:
1. Verify `#unaddedKpiBanner`, `#addAllUnaddedKpiBtn`, `#unaddedKpiItemsList`, `#toggleUnaddedListBtn` exist in `popup/popup.html`.
2. Verify banner styles and amber color theme exist in `popup/popup.css`.
3. Verify settings inputs `#kpiReminderEnabledInput` and `#kpiReminderMinutesInput` exist.
4. Verify `renderUnaddedKpiBanner` function logic (populates task list, toggles visibility, attaches add events).

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch/test_unadded_tasks_warning.js`
Expected: FAIL (missing DOM elements/styles)

- [ ] **Step 3: Update `popup/popup.html` and `popup/popup.css`**

1. In `popup/popup.html`:
   - Add `<div id="unaddedKpiBanner" class="unadded-kpi-banner" style="display: none;">` right above `.tab-container`.
   - Add banner header: warning icon `⚠️`, title text `#unaddedKpiTitle`, button `#addAllUnaddedKpiBtn` ("➕ Thêm tất cả vào KPI"), button `#toggleUnaddedListBtn` ("Chi tiết ▼").
   - Add expandable list `<div id="unaddedKpiItemsList" class="unadded-kpi-items-list" style="display: none;"></div>`.
   - In `#settings-tab` or Check-in/out section: add checkbox `#kpiReminderEnabledInput` ("Nhắc nhở task chưa thêm vào KPI cuối ngày") and number input `#kpiReminderMinutesInput` ("Nhắc trước (phút)").
2. In `popup/popup.css`:
   - Style `.unadded-kpi-banner` (amber background `#fef3c7`, border `#f59e0b`, text `#92400e`, flex layout, rounded corners).
   - Style `.unadded-kpi-item` row with title, link, and button `.unadded-kpi-add-btn`.

- [ ] **Step 4: Update `popup/popup.js`**

1. Implement `renderUnaddedKpiBanner()`:
   - Reads `UnaddedTodayTasks` from storage.
   - If non-empty, shows `#unaddedKpiBanner`, populates task count and task cards in `#unaddedKpiItemsList`.
   - If empty, hides `#unaddedKpiBanner` and clears badge text.
2. Wire `#addAllUnaddedKpiBtn`:
   - Appends all tasks in `UnaddedTodayTasks` into `WorkItemIds` in storage.
   - Sets `UnaddedTodayTasks = []`.
   - Hides banner, clears badge, and displays success message.
3. Wire individual `.unadded-kpi-add-btn`:
   - Adds specific task to `WorkItemIds`, removes from `UnaddedTodayTasks`, re-renders.
4. Wire `#toggleUnaddedListBtn` to toggle `#unaddedKpiItemsList`.
5. Wire settings inputs `#kpiReminderEnabledInput` and `#kpiReminderMinutesInput` saving to `chrome.storage.local`.
6. Listen to `chrome.storage.onChanged` for real-time banner update.

- [ ] **Step 5: Run unit tests to verify they pass**

Run: `node scratch/test_unadded_tasks_warning.js`
Expected: PASS

- [ ] **Step 6: Syntax check & Commit**

Run: `node -c popup/popup.js`
Commit:
```bash
git add popup/popup.html popup/popup.css popup/popup.js scratch/test_unadded_tasks_warning.js
git commit -m "feat(popup): add unadded KPI tasks warning banner with 1-click batch add"
```

---

### Task 4: Full Pipeline Regression Testing & Security Verification

**Files:**
- Modify: `scratch/test_full_suite.js`
- Test: `scratch/test_full_suite.js`

**Interfaces:**
- Consumes: All 10 test suites, all JS files, all HTML files.
- Produces: 100% green verification across 10 sub-suites, 18+ syntax checks, CSP security validation.

- [ ] **Step 1: Register Suite 10 in `scratch/test_full_suite.js`**

1. Add `scratch/test_unadded_tasks_warning.js` as Suite 10 in `subSuites` array.
2. Verify all JS files (`utils.js`, `background.js`, `popup/popup.js`, `content_issue.js`, etc.) are checked with `node -c`.
3. Verify CSP checks pass on `popup/popup.html`, `page/page.html`, `note/note.html`, `todo/todo.html`.

- [ ] **Step 2: Run complete regression suite**

Run: `node scratch/test_full_suite.js`
Expected:
```
================================================================
  REGRESSION SUITE EXECUTION SUMMARY
================================================================
  Sub-suites Passed:  10 / 10
  Security & Syntax:  18 / 18

  RESULT: ALL REGRESSION TESTS AND VERIFICATIONS PASSED SUCCESSFULLY! 🚀
================================================================
```

- [ ] **Step 3: Commit and report**

Commit:
```bash
git add scratch/test_full_suite.js
git commit -m "chore(test): integrate unadded tasks warning suite into full regression pipeline"
```
