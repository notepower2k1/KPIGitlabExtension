# Monthly Analytics & Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 2-tab navigation system on the KPI page containing a full Monthly Analytics Dashboard with Chart.js offline and a Daily Timesheet Audit for working days (T2-T6).

**Architecture:** 
Add a top tab-bar switching between Tab 1 (`#workItemsTabContent`) and Tab 2 (`#analyticsTabContent`). Tab 2 contains Monthly Summary Cards, a Daily Timesheet Matrix (auditing 8h/day on Mon-Fri), and a 2x2 responsive Chart.js visual grid (Estimate vs Spent by week, Planned vs Unplanned doughnut, On-time vs Late vs Open doughnut, and KPI score weekly trend). Chart instances are tracked and safely destroyed before re-render on month changes.

**Tech Stack:** JavaScript (ES6+), HTML5 Canvas, CSS3 Grid/Flexbox, Chart.js v4.4.4 UMD (offline local bundle), Chrome Extension Manifest V3.

**Spec:** [docs/superpowers/specs/2026-09-30-monthly-analytics-charts-design.md](file:///D:/CodingTime/KPIGitlabExtension/docs/superpowers/specs/2026-09-30-monthly-analytics-charts-design.md)

## Global Constraints
- Manifest V3 CSP: Absolutely no external CDNs or eval(). `chart.umd.min.js` must be bundled locally in `page/`.
- Working days for daily timesheet audit: Monday through Friday target is 8.0h/day. Saturday and Sunday are weekends (no penalty/warning if 0h, but logged hours count towards monthly total).
- Backwards compatibility: Existing Tab 1 controls (quick search, filter chips, export Excel, delete week/month, daily report) must continue working with 0 regressions.

---

### Task 1: Verify Chart.js Offline Bundle and Load in HTML

**Files:**
- Create/Verify: `page/chart.umd.min.js`
- Modify: `page/page.html:13-16`

**Interfaces:**
- Consumes: `page/chart.umd.min.js`
- Produces: Global `Chart` object available in `page.js`

- [ ] **Step 1: Verify `page/chart.umd.min.js` file exists and is valid**

```powershell
node -e "const fs = require('fs'); const content = fs.readFileSync('page/chart.umd.min.js', 'utf8'); console.log('Chart.js length:', content.length, 'Has Chart:', content.includes('Chart'));"
```

- [ ] **Step 2: Add script tag to `page/page.html`**

In `page/page.html`, right after `<script src="exceljs.min.js"></script>`:
```html
<script src="exceljs.min.js"></script>
<script src="chart.umd.min.js"></script>
<script src="page.js" defer></script>
```

- [ ] **Step 3: Verify script inclusion with test**

```powershell
node -e "const fs = require('fs'); const html = fs.readFileSync('page/page.html', 'utf8'); if (!html.includes('chart.umd.min.js')) throw new Error('Missing chart.umd.min.js in page.html'); console.log('OK: chart.umd.min.js included');"
```

- [ ] **Step 4: Commit**

```bash
git add page/chart.umd.min.js page/page.html
git commit -m "chore: add offline Chart.js bundle to page.html"
```

---

### Task 2: HTML & CSS Structure for Tabs and Analytics Dashboard

**Files:**
- Modify: `page/page.html`
- Modify: `page/page.css`

**Interfaces:**
- Produces:
  - Element `.tabs-nav` with buttons `#tabWorkItemsBtn` and `#tabAnalyticsBtn`
  - Container `#workItemsTabContent` (wrapping `#quickControlsCard` and `#kpiContainer`)
  - Container `#analyticsTabContent` containing:
    - `#monthlyKpiSummaryCards`
    - `#dailyTimesheetSection` (summary stats + `#timesheetCalendarGrid`)
    - `#monthlyChartsSection` (4 canvas elements: `#chartWeeklyEstSpent`, `#chartTaskType`, `#chartTaskStatus`, `#chartKpiTrend`)

- [ ] **Step 1: Write HTML markup in `page/page.html`**

Add the tabs navigation below `.filter-card`:
```html
<!-- Navigation Tabs -->
<div class="tabs-nav-container">
    <div class="tabs-nav">
        <button class="tab-btn active" id="tabWorkItemsBtn" type="button">
            <span class="tab-icon">📋</span>
            <span>Chi tiết công việc</span>
        </button>
        <button class="tab-btn" id="tabAnalyticsBtn" type="button">
            <span class="tab-icon">📊</span>
            <span>Phân tích & Biểu đồ Tháng</span>
            <span class="tab-badge" id="tabAnalyticsMonthBadge">Tháng 09/2026</span>
        </button>
    </div>
</div>
```

Wrap work items in `<div id="workItemsTabContent">...</div>`, and add `<div id="analyticsTabContent" style="display: none;">...</div>` with the timesheet and chart cards.

- [ ] **Step 2: Add CSS rules to `page/page.css`**

Add styles for:
- `.tabs-nav-container`, `.tabs-nav`, `.tab-btn`, `.tab-btn.active`, `.tab-badge`
- `#analyticsTabContent`, `.analytics-summary-grid`, `.analytics-stat-card`
- `.timesheet-audit-card`, `.timesheet-summary-chips`, `.timesheet-grid`, `.timesheet-day-cell`
  - `.day-success` (>= 8h)
  - `.day-warning` (0h < spent < 8h)
  - `.day-danger` (0h on past weekday)
  - `.day-weekend` (Sat/Sun)
  - `.day-future` (future date)
- `.charts-grid-container`, `.chart-card`, `.chart-wrapper`

- [ ] **Step 3: Verify HTML and CSS syntax**

```powershell
node -e "const fs = require('fs'); const html = fs.readFileSync('page/page.html', 'utf8'); const css = fs.readFileSync('page/page.css', 'utf8'); ['tabWorkItemsBtn', 'tabAnalyticsBtn', 'workItemsTabContent', 'analyticsTabContent', 'chartWeeklyEstSpent'].forEach(id => { if (!html.includes(id)) throw new Error('Missing ID: ' + id); }); console.log('OK: HTML and CSS structure verified');"
```

- [ ] **Step 4: Commit**

```bash
git add page/page.html page/page.css
git commit -m "feat(ui): add tab navigation and analytics layout in page.html and page.css"
```

---

### Task 3: Implement Daily Timesheet Audit Calculation & Rendering

**Files:**
- Modify: `page/page.js`
- Test: `scratch/test_timesheet_audit.js`

**Interfaces:**
- Consumes: `storedKpi` array, `selectedMonth` (`YYYY-MM`)
- Produces:
  - `calculateMonthlyTimesheet(items, selYear, selMonth)` returns object with:
    - `days`: array of day objects `{ dateIso, dayNum, dayOfWeek, dayName, spentHours, targetHours, isWeekend, isFuture, isPastOrToday, status, diffHours, taskItems }`
    - `totalWorkingDays`: number of Mon-Fri days in month
    - `totalTargetHours`: `totalWorkingDays * 8`
    - `totalSpentHours`: sum of all spent hours
    - `deficitDaysCount`: number of past/today weekdays with spent < 8h
    - `achievementRate`: `(totalSpentHours / totalTargetHours) * 100`
  - `renderDailyTimesheet(timesheetData)` renders into `#dailyTimesheetSection`

- [ ] **Step 1: Write unit test in `scratch/test_timesheet_audit.js`**

```javascript
const { calculateMonthlyTimesheet } = require('./timesheet_logic_helper.js');
// Test September 2026 (30 days, starts on Tuesday)
// Verify weekdays count, weekend identification, 8h thresholds
```

- [ ] **Step 2: Run test to verify it fails initially**

```powershell
node scratch/test_timesheet_audit.js
```

- [ ] **Step 3: Implement `calculateMonthlyTimesheet` and `renderDailyTimesheet` in `page/page.js`**

- [ ] **Step 4: Run test to verify it passes**

```powershell
node scratch/test_timesheet_audit.js
```

- [ ] **Step 5: Commit**

```bash
git add page/page.js scratch/test_timesheet_audit.js
git commit -m "feat(analytics): implement daily timesheet audit calculation and rendering"
```

---

### Task 4: Implement Monthly Chart.js Data Aggregation & Rendering

**Files:**
- Modify: `page/page.js`
- Test: `scratch/test_chart_aggregation.js`

**Interfaces:**
- Consumes: `storedKpi` array, `selectedMonth` (`YYYY-MM`), global `Chart`
- Produces:
  - `calculateMonthlyChartData(items, selYear, selMonth)` returns:
    - `weeklyData`: `{ labels, estimateHours, spentHours, kpiScores }`
    - `taskTypeData`: `{ plannedCount, unplannedCount }`
    - `taskStatusData`: `{ inTimeCount, lateCount, openCount }`
  - `renderMonthlyCharts(chartData)` manages Chart instances in `analyticsCharts`:
    - Safely destroys old instances: `if (analyticsCharts[key]) analyticsCharts[key].destroy()`
    - Creates 4 responsive charts with custom tooltips and sleek modern palettes

- [ ] **Step 1: Write test in `scratch/test_chart_aggregation.js`**

```javascript
// Test weekly grouping using getWeeksOfMonth
// Test status distribution and type distribution
```

- [ ] **Step 2: Run test to verify it fails initially**

```powershell
node scratch/test_chart_aggregation.js
```

- [ ] **Step 3: Implement `calculateMonthlyChartData` and `renderMonthlyCharts` in `page/page.js`**

- [ ] **Step 4: Run test to verify it passes**

```powershell
node scratch/test_chart_aggregation.js
```

- [ ] **Step 5: Commit**

```bash
git add page/page.js scratch/test_chart_aggregation.js
git commit -m "feat(analytics): implement Chart.js monthly visual charts"
```

---

### Task 5: Tab Controller Integration & Synchronization

**Files:**
- Modify: `page/page.js`
- Test: `scratch/test_tab_controller.js`

**Interfaces:**
- Connects `#tabWorkItemsBtn` and `#tabAnalyticsBtn` click events
- Updates `#tabAnalyticsMonthBadge` text (e.g., `Tháng 09/2026`) when `monthSelect` changes
- Synchronizes analytics refresh when switching to Tab 2 or when `getDetailBtn` is clicked

- [ ] **Step 1: Implement tab switching and event handlers in `page/page.js`**

```javascript
function initTabs() {
    const tabWorkItemsBtn = document.getElementById('tabWorkItemsBtn');
    const tabAnalyticsBtn = document.getElementById('tabAnalyticsBtn');
    const workItemsContent = document.getElementById('workItemsTabContent');
    const analyticsContent = document.getElementById('analyticsTabContent');
    // Switch active states & toggle display
    // Trigger refreshMonthlyAnalytics() on tab 2 switch
}
```

- [ ] **Step 2: Verify tab integration and syntax**

```powershell
node -c page/page.js
```

- [ ] **Step 3: Commit**

```bash
git add page/page.js
git commit -m "feat(analytics): integrate tab controller and monthly synchronization"
```

---

### Task 6: Full Regression Testing & Polish

**Files:**
- Test: `scratch/test_full_suite.js`

- [ ] **Step 1: Create and run comprehensive regression test suite**
- [ ] **Step 2: Verify all tab, filter, search, daily report, and chart functions**
- [ ] **Step 3: Final commit**

```bash
git commit -m "feat: complete monthly analytics dashboard with timesheet audit and visual charts"
```
