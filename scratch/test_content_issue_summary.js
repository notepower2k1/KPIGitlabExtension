const assert = require('assert');

console.log('--- Running GitLab Issue Summary Unit Tests ---');

let contentIssueModule;
try {
    contentIssueModule = require('../content_issue.js');
} catch (err) {
    console.error('Failed to import content_issue.js:', err.message);
}

const {
    calculateChildTaskMetrics,
    filterMyChildTasks,
    renderSummaryModalHtml
} = contentIssueModule || {};

// 1. Function existence tests
assert.strictEqual(typeof calculateChildTaskMetrics, 'function', 'calculateChildTaskMetrics should be exported as a function');
assert.strictEqual(typeof filterMyChildTasks, 'function', 'filterMyChildTasks should be exported as a function');
assert.strictEqual(typeof renderSummaryModalHtml, 'function', 'renderSummaryModalHtml should be exported as a function');
console.log('✔ Passed: Exported functions existence check');

// 2. Metric calculation: standard scenarios
{
    const sampleTasks = [
        { id: '101', title: 'Implement login', estimateHour: 4, spentHour: 3.5, state: 'closed', isLate: false, isUnplanned: false },
        { id: '102', title: 'Fix bug in auth', estimateHour: 2, spentHour: 3, state: 'closed', isLate: true, isUnplanned: false },
        { id: '103', title: 'Refactor session', estimateHour: 5, spentHour: 1.5, state: 'opened', isLate: false, isUnplanned: true }
    ];

    const metrics = calculateChildTaskMetrics(sampleTasks);

    assert.strictEqual(metrics.totalTasks, 3, 'totalTasks must be 3');
    assert.strictEqual(metrics.totalEstimate, 11, 'totalEstimate must be 4 + 2 + 5 = 11');
    assert.strictEqual(metrics.totalSpent, 8, 'totalSpent must be 3.5 + 3 + 1.5 = 8');
    assert.strictEqual(metrics.diffHours, 3, 'diffHours must be 11 - 8 = 3');
    assert.strictEqual(metrics.openTasks, 1, 'openTasks must be 1');
    assert.strictEqual(metrics.closedTasks, 2, 'closedTasks must be 2');
    assert.strictEqual(metrics.lateTasks, 1, 'lateTasks must be 1');
    assert.strictEqual(metrics.onTimeRate, 50, 'onTimeRate must be (2 - 1) / 2 * 100 = 50%');
    assert.strictEqual(metrics.plannedCount, 2, 'plannedCount must be 2');
    assert.strictEqual(metrics.unplannedCount, 1, 'unplannedCount must be 1');
    console.log('✔ Passed: Standard metric calculations');
}

// 3. Floating point precision & string parsing
{
    const decimalTasks = [
        { estimateHour: 0.1, spentHour: 0.2, state: 'opened' },
        { estimateHour: 0.2, spentHour: 0.4, state: 'closed', isLate: false },
        { estimateHour: '2.5', spentHour: '1.2', state: 'closed', isLate: false }
    ];

    const metrics = calculateChildTaskMetrics(decimalTasks);

    assert.strictEqual(metrics.totalTasks, 3);
    assert.strictEqual(metrics.totalEstimate, 2.8, '0.1 + 0.2 + 2.5 = 2.8');
    assert.strictEqual(metrics.totalSpent, 1.8, '0.2 + 0.4 + 1.2 = 1.8');
    assert.strictEqual(metrics.diffHours, 1, '2.8 - 1.8 = 1.0');
    assert.strictEqual(metrics.onTimeRate, 100, '2 closed tasks, 0 late = 100%');
    console.log('✔ Passed: Floating point precision and string value handling');
}

// 4. Edge cases: empty list, null/undefined, 0 closed tasks, all late
{
    const emptyMetrics = calculateChildTaskMetrics([]);
    assert.strictEqual(emptyMetrics.totalTasks, 0);
    assert.strictEqual(emptyMetrics.totalEstimate, 0);
    assert.strictEqual(emptyMetrics.totalSpent, 0);
    assert.strictEqual(emptyMetrics.diffHours, 0);
    assert.strictEqual(emptyMetrics.openTasks, 0);
    assert.strictEqual(emptyMetrics.closedTasks, 0);
    assert.strictEqual(emptyMetrics.lateTasks, 0);
    assert.strictEqual(emptyMetrics.onTimeRate, 100, 'Default onTimeRate with 0 closed tasks should be 100');
    assert.strictEqual(emptyMetrics.plannedCount, 0);
    assert.strictEqual(emptyMetrics.unplannedCount, 0);

    const nullMetrics = calculateChildTaskMetrics(null);
    assert.strictEqual(nullMetrics.totalTasks, 0);
    assert.strictEqual(nullMetrics.onTimeRate, 100);

    // Only open tasks (closed = 0)
    const openOnlyTasks = [
        { estimateHour: 5, spentHour: 2, state: 'opened', isLate: false }
    ];
    const openMetrics = calculateChildTaskMetrics(openOnlyTasks);
    assert.strictEqual(openMetrics.closedTasks, 0);
    assert.strictEqual(openMetrics.onTimeRate, 100, 'When no closed tasks exist, onTimeRate is 100%');

    // All closed tasks are late
    const allLateTasks = [
        { estimateHour: 3, spentHour: 4, state: 'closed', isLate: true },
        { estimateHour: 2, spentHour: 2, state: 'closed', isLate: true }
    ];
    const lateMetrics = calculateChildTaskMetrics(allLateTasks);
    assert.strictEqual(lateMetrics.closedTasks, 2);
    assert.strictEqual(lateMetrics.lateTasks, 2);
    assert.strictEqual(lateMetrics.onTimeRate, 0, 'When all closed tasks are late, onTimeRate is 0%');
    console.log('✔ Passed: Edge cases (empty, null, open only, all late)');
}

// 5. Child task filtering tests
{
    const items = [
        { id: '1', title: 'Task 1', href: '/tasks/1', assigneeUrl: 'https://gitlab.com/john' },
        { id: '2', title: 'Task 2', href: '/tasks/2', assigneeUrl: 'https://gitlab.com/alice' },
        { id: '3', title: 'Task 3', href: '/tasks/3', assigneeUrl: 'https://gitlab.com/john' },
        { id: '4', title: 'Task 4', href: '/tasks/4' } // unassigned
    ];

    const johnTasks = filterMyChildTasks(items, 'https://gitlab.com/john');
    assert.strictEqual(johnTasks.length, 2);
    assert.strictEqual(johnTasks[0].id, '1');
    assert.strictEqual(johnTasks[1].id, '3');

    const aliceTasks = filterMyChildTasks(items, 'https://gitlab.com/alice');
    assert.strictEqual(aliceTasks.length, 1);
    assert.strictEqual(aliceTasks[0].id, '2');

    // When userProfileUrl is null or empty, returns all items
    const allItems = filterMyChildTasks(items, null);
    assert.strictEqual(allItems.length, 4);

    const allItemsEmptyUrl = filterMyChildTasks(items, '');
    assert.strictEqual(allItemsEmptyUrl.length, 4);

    // Empty list or invalid items
    assert.deepStrictEqual(filterMyChildTasks([], 'https://gitlab.com/john'), []);
    assert.deepStrictEqual(filterMyChildTasks(null, 'https://gitlab.com/john'), []);
    console.log('✔ Passed: Child task filtering by assignee');
}

// 6. Modal HTML rendering tests
{
    const sampleTasks = [
        {
            id: '101',
            title: 'Task Alpha <script>',
            href: 'https://gitlab.com/group/project/-/work_items/101',
            estimateHour: 4,
            spentHour: 3.5,
            diffHour: 0.5,
            state: 'closed',
            isLate: false,
            isUnplanned: false
        },
        {
            id: '102',
            title: 'Task Beta & Gamma',
            href: 'https://gitlab.com/group/project/-/work_items/102',
            estimateHour: 2,
            spentHour: 3,
            diffHour: -1,
            state: 'opened',
            isLate: false,
            isUnplanned: true
        }
    ];

    const metrics = calculateChildTaskMetrics(sampleTasks);
    const parentTitle = 'Parent Epic "Core Feature"';

    const html = renderSummaryModalHtml(metrics, sampleTasks, parentTitle);

    // Structural elements
    assert.ok(html.includes('id="gitlabKpiSummaryModal"'), 'Must contain modal overlay id');
    assert.ok(html.includes('class="gl-kpi-modal-overlay"'), 'Must have modal overlay class');
    assert.ok(html.includes('id="glKpiAddAllBtn"'), 'Must contain Add All button');
    assert.ok(html.includes('id="glKpiRefreshBtn"'), 'Must contain Refresh button');
    assert.ok(html.includes('id="glKpiCloseBtn"'), 'Must contain Close button');
    assert.ok(html.includes('id="glKpiTableBody"'), 'Must contain Table Body container');

    // Content & metrics assertions
    assert.ok(html.includes('Parent Epic &quot;Core Feature&quot;') || html.includes('Parent Epic &#39;Core Feature&#39;') || html.includes('Parent Epic "Core Feature"') || html.includes('Core Feature'), 'Must display parent title');
    assert.ok(html.includes('6h') || html.includes('6.0h') || html.includes('6'), 'Must display total estimate');
    assert.ok(html.includes('6.5h') || html.includes('6.5'), 'Must display total spent');
    assert.ok(html.includes('100%'), 'Must display on-time rate for closed tasks (1 closed, 0 late)');

    // Row contents & XSS safety
    assert.ok(html.includes('&lt;script&gt;'), 'Must sanitize XSS characters in title');
    assert.ok(!html.includes('<script>'), 'Must NOT contain raw script tag');
    assert.ok(html.includes('Task Beta &amp; Gamma') || html.includes('Task Beta & Gamma'), 'Must render Task Beta');
    assert.ok(html.includes('https://gitlab.com/group/project/-/work_items/101'), 'Must include task link');

    // Empty tasks rendering
    const emptyHtml = renderSummaryModalHtml(calculateChildTaskMetrics([]), [], 'Empty Parent');
    assert.ok(emptyHtml.includes('id="gitlabKpiSummaryModal"'));
    assert.ok(emptyHtml.includes('id="glKpiTableBody"'));
    assert.ok(emptyHtml.toLowerCase().includes('không tìm thấy') || emptyHtml.toLowerCase().includes('không có task'), 'Empty state message');

    console.log('✔ Passed: Modal HTML rendering and escaping');
}

console.log('\n--- ALL GITLAB ISSUE SUMMARY TESTS PASSED ---');
