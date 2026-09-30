const assert = require('assert');

// Test Daily Timesheet Audit Calculation & Rendering
console.log('--- Running Daily Timesheet Audit Unit Tests ---');

let calculateMonthlyTimesheet;
let renderDailyTimesheet;

try {
    const pageModule = require('../page/page.js');
    calculateMonthlyTimesheet = pageModule.calculateMonthlyTimesheet;
    renderDailyTimesheet = pageModule.renderDailyTimesheet;
} catch (err) {
    console.error('Failed to import page.js:', err.message);
}

// 1. Function existence test
assert.strictEqual(typeof calculateMonthlyTimesheet, 'function', 'calculateMonthlyTimesheet should be exported as a function');

// 2. September 2026 Calendar Structure Test (30 days, 22 working days, 8 weekends)
{
    const items = [];
    const result = calculateMonthlyTimesheet(items, 2026, 9, new Date('2026-09-30T23:59:59'));

    assert.strictEqual(result.days.length, 30, 'September 2026 must have 30 days');
    assert.strictEqual(result.totalWorkingDays, 22, 'September 2026 must have 22 working days');
    assert.strictEqual(result.totalTargetHours, 176, 'Target hours must be 22 * 8 = 176h');

    const weekends = result.days.filter(d => d.isWeekend);
    assert.strictEqual(weekends.length, 8, 'September 2026 must have 8 weekend days');

    // Sep 1, 2026 is Tuesday (T3)
    const day1 = result.days[0];
    assert.strictEqual(day1.dateIso, '2026-09-01');
    assert.strictEqual(day1.dayNum, 1);
    assert.strictEqual(day1.dayOfWeek, 2);
    assert.strictEqual(day1.dayName, 'T3');
    assert.strictEqual(day1.isWeekend, false);

    // Sep 5, 2026 is Saturday (T7)
    const day5 = result.days[4];
    assert.strictEqual(day5.dateIso, '2026-09-05');
    assert.strictEqual(day5.dayOfWeek, 6);
    assert.strictEqual(day5.dayName, 'T7');
    assert.strictEqual(day5.isWeekend, true);

    // Sep 6, 2026 is Sunday (CN)
    const day6 = result.days[5];
    assert.strictEqual(day6.dateIso, '2026-09-06');
    assert.strictEqual(day6.dayOfWeek, 0);
    assert.strictEqual(day6.dayName, 'CN');
    assert.strictEqual(day6.isWeekend, true);
    console.log('✔ Passed: September 2026 calendar structure test');
}

// 3. Threshold & Status Tests (success, warning, danger, weekend)
{
    const mockItems = [
        // Sep 1 (Tue): 8.5h -> success
        { addedAt: '2026-09-01T08:00:00', spent: 8.5, title: 'Feature A' },
        // Sep 2 (Wed): two tasks 4h + 4h = 8.0h -> success
        { addedAt: '2026-09-02', spent: 4.0, title: 'Task B1' },
        { addedAt: '2026-09-02', spent: 4.0, title: 'Task B2' },
        // Sep 3 (Thu): 6.0h -> warning (diff = -2.0h)
        { addedAt: '2026-09-03', spent: 6.0, title: 'Task C' },
        // Sep 4 (Fri): 0h logged (no items) -> danger (diff = -8.0h)
        // Sep 5 (Sat): 3.5h logged on weekend -> weekend status, counted in total
        { addedAt: '2026-09-05', spent: 3.5, title: 'Weekend overtime' },
        // Sep 6 (Sun): 0h on weekend -> weekend status (not danger!)
    ];

    const result = calculateMonthlyTimesheet(mockItems, 2026, 9, new Date('2026-09-06T23:59:59'));

    const day1 = result.days.find(d => d.dateIso === '2026-09-01');
    assert.strictEqual(day1.spentHours, 8.5);
    assert.strictEqual(day1.status, 'success');
    assert.strictEqual(day1.diffHours, 0.5);

    const day2 = result.days.find(d => d.dateIso === '2026-09-02');
    assert.strictEqual(day2.spentHours, 8.0);
    assert.strictEqual(day2.status, 'success');
    assert.strictEqual(day2.diffHours, 0);
    assert.strictEqual(day2.taskItems.length, 2);

    const day3 = result.days.find(d => d.dateIso === '2026-09-03');
    assert.strictEqual(day3.spentHours, 6.0);
    assert.strictEqual(day3.status, 'warning');
    assert.strictEqual(day3.diffHours, -2.0);

    const day4 = result.days.find(d => d.dateIso === '2026-09-04');
    assert.strictEqual(day4.spentHours, 0);
    assert.strictEqual(day4.status, 'danger');
    assert.strictEqual(day4.diffHours, -8.0);

    const day5 = result.days.find(d => d.dateIso === '2026-09-05');
    assert.strictEqual(day5.spentHours, 3.5);
    assert.strictEqual(day5.isWeekend, true);
    assert.strictEqual(day5.status, 'weekend');
    assert.strictEqual(day5.diffHours, 3.5);

    const day6 = result.days.find(d => d.dateIso === '2026-09-06');
    assert.strictEqual(day6.spentHours, 0);
    assert.strictEqual(day6.isWeekend, true);
    assert.strictEqual(day6.status, 'weekend');
    assert.strictEqual(day6.diffHours, 0);

    console.log('✔ Passed: Threshold & status classification test');
}

// 4. Future Days Test (Mid-month reference date)
{
    const items = [
        { addedAt: '2026-09-01', spent: 8.0 },
        { addedAt: '2026-09-10', spent: 8.0 },
    ];
    // Reference date: Sep 10, 2026
    const result = calculateMonthlyTimesheet(items, 2026, 9, new Date('2026-09-10T12:00:00'));

    const day10 = result.days.find(d => d.dateIso === '2026-09-10');
    assert.strictEqual(day10.isFuture, false);
    assert.strictEqual(day10.isPastOrToday, true);
    assert.strictEqual(day10.status, 'success');

    const day11 = result.days.find(d => d.dateIso === '2026-09-11');
    assert.strictEqual(day11.isFuture, true);
    assert.strictEqual(day11.isPastOrToday, false);
    assert.strictEqual(day11.status, 'future');
    // Future days must NOT be danger even if spent == 0
    assert.notStrictEqual(day11.status, 'danger');

    // Deficit days should only count past/today weekdays
    // Sep 1 to Sep 10 has 8 weekdays: Sep 1, 2, 3, 4, 7, 8, 9, 10.
    // Only Sep 1 and Sep 10 have 8h. Other 6 weekdays have 0h.
    assert.strictEqual(result.deficitDaysCount, 6, 'Deficit days must only count past/today weekdays');

    console.log('✔ Passed: Future days handling test');
}

// 5. Monthly Summary Stats Test
{
    const items = [
        { addedAt: '2026-09-01', spent: 8.0 },
        { addedAt: '2026-09-02', spent: 8.0 },
        { addedAt: '2026-09-03', spent: 6.0 },
        { addedAt: '2026-09-04', spent: 0 },
        { addedAt: '2026-09-05', spent: 4.0 }, // weekend 4h
    ];
    // Reference date: end of month (Sep 30)
    const result = calculateMonthlyTimesheet(items, 2026, 9, new Date('2026-09-30T23:59:59'));

    // totalSpent = 8 + 8 + 6 + 0 + 4 = 26.0h
    assert.strictEqual(result.totalSpentHours, 26.0);
    assert.strictEqual(result.totalTargetHours, 176);
    // achievementRate = (26 / 176) * 100 = 14.77... -> 14.8%
    assert.strictEqual(result.achievementRate, 14.8);
    // deficit days: 22 working days in month, 2 met 8h (Sep 1, Sep 2), 20 did not (Sep 3 + remaining 19)
    assert.strictEqual(result.deficitDaysCount, 20);

    console.log('✔ Passed: Monthly summary stats calculation test');
}

// 6. DOM Rendering Test
{
    // Minimal mock DOM elements
    const mockElements = {
        timesheetSummaryChips: { innerHTML: '', appendChild(el) { this.children.push(el); }, children: [] },
        timesheetCalendarGrid: { innerHTML: '', appendChild(el) { this.children.push(el); }, children: [] }
    };

    global.document = {
        getElementById(id) {
            return mockElements[id] || null;
        },
        createElement(tag) {
            return {
                tagName: tag,
                className: '',
                classList: {
                    add(c) { this.classes.push(c); },
                    classes: []
                },
                style: {},
                textContent: '',
                innerHTML: '',
                children: [],
                appendChild(c) { this.children.push(c); },
                setAttribute(k, v) { this[k] = v; },
                addEventListener() {}
            };
        }
    };

    assert.strictEqual(typeof renderDailyTimesheet, 'function', 'renderDailyTimesheet should be a function');

    const sampleData = calculateMonthlyTimesheet([
        { addedAt: '2026-09-01', spent: 8.0, title: 'Sample Task' }
    ], 2026, 9, new Date('2026-09-30T23:59:59'));

    renderDailyTimesheet(sampleData);

    assert(mockElements.timesheetSummaryChips.innerHTML.length > 0 || mockElements.timesheetSummaryChips.children.length > 0, 'Summary chips should be rendered');
    assert(mockElements.timesheetCalendarGrid.innerHTML.length > 0 || mockElements.timesheetCalendarGrid.children.length === 30, 'Calendar grid should render 30 day cells');

    console.log('✔ Passed: DOM rendering test');
}

// 7. Edge Cases: Different date formats, string spent values, and leap year
{
    // Leap year February 2024: 29 days
    const feb2024 = calculateMonthlyTimesheet([], 2024, 2, new Date('2024-02-29'));
    assert.strictEqual(feb2024.days.length, 29, 'Feb 2024 (leap year) must have 29 days');
    // Feb 2026: 28 days
    const feb2026 = calculateMonthlyTimesheet([], 2026, 2, new Date('2026-02-28'));
    assert.strictEqual(feb2026.days.length, 28, 'Feb 2026 (non-leap year) must have 28 days');

    // Various date formats and spent representations
    const diverseItems = [
        { addedAt: '01/09/2026 08:30:00', spent: '8.5' }, // DD/MM/YYYY + string spent
        { createAt: new Date(2026, 8, 2, 10, 0, 0), spentTime: 7.5 }, // Date obj + spentTime
        { dateIso: '2026-09-03', totalSpentTime: '9.0' }, // dateIso + totalSpentTime string
        { spentAt: '2026-09-04T12:00:00.000Z', spent: 0 } // ISO string with T and Z
    ];

    const result = calculateMonthlyTimesheet(diverseItems, 2026, 9, new Date('2026-09-04T23:59:59'));
    assert.strictEqual(result.days[0].spentHours, 8.5);
    assert.strictEqual(result.days[0].status, 'success');

    assert.strictEqual(result.days[1].spentHours, 7.5);
    assert.strictEqual(result.days[1].status, 'warning');

    assert.strictEqual(result.days[2].spentHours, 9.0);
    assert.strictEqual(result.days[2].status, 'success');

    assert.strictEqual(result.days[3].spentHours, 0);
    assert.strictEqual(result.days[3].status, 'danger');

    console.log('✔ Passed: Edge cases (date formats, string spent, leap year) test');
}

console.log('\n--- ALL TIMESHEET AUDIT TESTS PASSED ---');

