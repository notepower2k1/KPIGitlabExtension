const assert = require('assert');
const path = require('path');

// Mock localStorage / chrome
global.chrome = {
    storage: {
        local: {
            get: (keys, cb) => cb({}),
            set: (data, cb) => { if (cb) cb(); }
        }
    }
};

const page = require('../page/page.js');
const { calculateMonthlyTimesheet } = page;

console.log('▶ Testing Leave Days Feature (Nghỉ 1 ngày & Nghỉ 1/2 ngày)...');

// Test September 2026: 30 days, 22 working days (T2-T6)
const testMonth = '2026-09';
const mockItems = [];

// 1. Baseline: No leave
const baseline = calculateMonthlyTimesheet(mockItems, testMonth, undefined, new Date(2026, 8, 30));
assert.strictEqual(baseline.totalWorkingDays, 22, 'Baseline should have 22 working days');
assert.strictEqual(baseline.totalTargetHours, 176, 'Baseline should have 176 target hours');

// 2. Full-day leave (Nghỉ 1 ngày): 2026-09-02 (Thứ 4)
const leaveMap1 = {
    '2026-09-02': { value: 1.0, type: 'full', reason: 'Nghỉ lễ Quốc Khánh' }
};
const res1 = calculateMonthlyTimesheet(mockItems, testMonth, undefined, new Date(2026, 8, 30), leaveMap1);
const day02 = res1.days.find(d => d.dateIso === '2026-09-02');
assert.ok(day02, 'Day 02 should exist');
assert.strictEqual(day02.isLeave, true, 'Day 02 should be flagged as leave');
assert.strictEqual(day02.leaveValue, 1.0, 'Day 02 should have 1.0 leave value');
assert.strictEqual(day02.targetHours, 0, 'Day 02 target hours should be 0h');
assert.strictEqual(day02.status, 'leave', 'Day 02 status should be leave');
assert.strictEqual(res1.totalLeaveDays, 1.0, 'Total leave days should be 1.0');
assert.strictEqual(res1.totalWorkingDays, 21.0, 'Working days should decrease to 21.0');
assert.strictEqual(res1.totalTargetHours, 168.0, 'Target hours should decrease to 168.0');
assert.strictEqual(res1.deficitDaysCount, 21, 'Deficit should exclude day 02 (21 days instead of 22)');

// 3. Half-day leave (Nghỉ 1/2 ngày): 2026-09-03 (Thứ 5)
// Case 3a: Spent >= 4h -> success
const mockItemsHalfSuccess = [
    { addedAt: '2026-09-03', totalSpentTime: 4.5, title: 'Task half day' }
];
const leaveMap2 = {
    '2026-09-03': { value: 0.5, type: 'half', reason: 'Khám bệnh buổi sáng' }
};
const res2a = calculateMonthlyTimesheet(mockItemsHalfSuccess, testMonth, undefined, new Date(2026, 8, 30), leaveMap2);
const day03a = res2a.days.find(d => d.dateIso === '2026-09-03');
assert.strictEqual(day03a.isLeave, true, 'Day 03 should be leave');
assert.strictEqual(day03a.leaveValue, 0.5, 'Day 03 leave value should be 0.5');
assert.strictEqual(day03a.targetHours, 4.0, 'Day 03 target hours should be 4.0h');
assert.strictEqual(day03a.spentHours, 4.5, 'Day 03 spent should be 4.5h');
assert.strictEqual(day03a.diffHours, 0.5, 'Day 03 diff should be +0.5h');
assert.strictEqual(day03a.status, 'leave-half-success', 'Day 03 status should be leave-half-success');
assert.strictEqual(res2a.totalLeaveDays, 0.5, 'Total leave days should be 0.5');
assert.strictEqual(res2a.totalWorkingDays, 21.5, 'Working days should be 21.5');
assert.strictEqual(res2a.totalTargetHours, 172.0, 'Target hours should be 172.0');

// Case 3b: Spent < 4h (e.g. 2h) -> warning
const mockItemsHalfWarning = [
    { addedAt: '2026-09-03', totalSpentTime: 2.0, title: 'Task partial' }
];
const res2b = calculateMonthlyTimesheet(mockItemsHalfWarning, testMonth, undefined, new Date(2026, 8, 30), leaveMap2);
const day03b = res2b.days.find(d => d.dateIso === '2026-09-03');
assert.strictEqual(day03b.status, 'warning', 'Day 03 status should be warning');
assert.strictEqual(day03b.diffHours, -2.0, 'Day 03 diff should be -2.0h');

// Case 3c: Spent == 0h on past day -> danger
const res2c = calculateMonthlyTimesheet([], testMonth, undefined, new Date(2026, 8, 30), leaveMap2);
const day03c = res2c.days.find(d => d.dateIso === '2026-09-03');
assert.strictEqual(day03c.status, 'danger', 'Day 03 with 0h should be danger');
assert.strictEqual(day03c.diffHours, -4.0, 'Day 03 diff should be -4.0h');

// 4. Combined 1 full day + 1 half day = 1.5 days leave
const combinedMap = {
    '2026-09-02': { value: 1.0, type: 'full', reason: 'Nghỉ lễ' },
    '2026-09-03': { value: 0.5, type: 'half', reason: 'Nghỉ nửa ngày' }
};
const resCombined = calculateMonthlyTimesheet([], testMonth, undefined, new Date(2026, 8, 30), combinedMap);
assert.strictEqual(resCombined.totalLeaveDays, 1.5, 'Total leave days should be 1.5');
assert.strictEqual(resCombined.totalWorkingDays, 20.5, 'Working days should be 20.5');
assert.strictEqual(resCombined.totalTargetHours, 164.0, 'Target hours should be 164.0');

console.log('✔ All Leave Days unit test assertions passed successfully! 🎉');
