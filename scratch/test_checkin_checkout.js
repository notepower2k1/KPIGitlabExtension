/**
 * Unit tests for Check-in / Check-out alert mechanism
 */

const assert = require('assert');
const path = require('path');

// Mock Chrome API before requiring background.js
global.chrome = {
    runtime: {
        onInstalled: { addListener: () => {} },
        onStartup: { addListener: () => {} },
        getURL: (pathStr) => `chrome-extension://mock-id/${pathStr}`
    },
    alarms: {
        create: () => {},
        onAlarm: { addListener: () => {} }
    },
    notifications: {
        create: () => {},
        clear: () => {},
        onClicked: { addListener: () => {} }
    },
    storage: {
        local: {
            get: async () => ({}),
            set: async () => ({})
        }
    },
    tabs: {
        create: () => {}
    }
};

const background = require('../background.js');

console.log('--- Testing Check-in / Check-out Alert Subsystem ---');

// 1. Test Day-of-week Filtering (Only Mon-Fri)
assert.strictEqual(typeof background.isWorkday, 'function', 'isWorkday should be a function');
// Sunday = 0, Saturday = 6
assert.strictEqual(background.isWorkday(new Date('2026-10-04T08:30:00')), false, 'Sunday should not be a workday');
assert.strictEqual(background.isWorkday(new Date('2026-10-03T08:30:00')), false, 'Saturday should not be a workday');
// Monday = 1, Wednesday = 3, Friday = 5
assert.strictEqual(background.isWorkday(new Date('2026-09-28T08:30:00')), true, 'Monday should be a workday');
assert.strictEqual(background.isWorkday(new Date('2026-09-30T08:30:00')), true, 'Wednesday should be a workday');
assert.strictEqual(background.isWorkday(new Date('2026-10-02T18:00:00')), true, 'Friday should be a workday');
console.log('✔ Passed: isWorkday correctly filters Mon-Fri vs Sat-Sun');

// 2. Test Time Parsing & Alert Evaluation Logic
assert.strictEqual(typeof background.evaluateAlertState, 'function', 'evaluateAlertState should be a function');

const defaultSettings = {
    enabled: true,
    targetTime: '08:30',
    snoozeMinutes: 5,
    maxRepeats: 3
};

// Case 2a: Before target time -> should NOT trigger
{
    const now = new Date('2026-09-30T08:15:00');
    const state = { lastDate: '2026-09-30', count: 0, done: false, lastNotified: null };
    const res = background.evaluateAlertState(now, defaultSettings, state);
    assert.strictEqual(res.shouldNotify, false, 'Should not notify before 08:30');
    assert.strictEqual(res.nextState.count, 0);
}
console.log('✔ Passed: Alert does not trigger before target time');

// Case 2b: At target time (08:30) -> should trigger first notification (count = 1)
{
    const now = new Date('2026-09-30T08:30:00');
    const state = { lastDate: '2026-09-30', count: 0, done: false, lastNotified: null };
    const res = background.evaluateAlertState(now, defaultSettings, state);
    assert.strictEqual(res.shouldNotify, true, 'Should notify at 08:30');
    assert.strictEqual(res.nextState.count, 1);
    assert.strictEqual(res.isSnooze, false);
    assert.ok(res.nextState.lastNotified, 'lastNotified must be set');
}
console.log('✔ Passed: Initial alert triggers at target time');

// Case 2c: 3 minutes after first notification (snooze is 5 mins) -> should NOT trigger yet
{
    const firstNotified = new Date('2026-09-30T08:30:00').toISOString();
    const now = new Date('2026-09-30T08:33:00');
    const state = { lastDate: '2026-09-30', count: 1, done: false, lastNotified: firstNotified };
    const res = background.evaluateAlertState(now, defaultSettings, state);
    assert.strictEqual(res.shouldNotify, false, 'Should not notify before snooze interval completes');
    assert.strictEqual(res.nextState.count, 1);
}
console.log('✔ Passed: Snooze does not trigger prematurely');

// Case 2d: 5 minutes after first notification -> should trigger snooze 1 (count = 2)
{
    const firstNotified = new Date('2026-09-30T08:30:00').toISOString();
    const now = new Date('2026-09-30T08:35:00');
    const state = { lastDate: '2026-09-30', count: 1, done: false, lastNotified: firstNotified };
    const res = background.evaluateAlertState(now, defaultSettings, state);
    assert.strictEqual(res.shouldNotify, true, 'Should notify after 5 minutes');
    assert.strictEqual(res.nextState.count, 2);
    assert.strictEqual(res.isSnooze, true);
    assert.strictEqual(res.repeatIndex, 1);
}
console.log('✔ Passed: Snooze triggers after interval');

// Case 2e: Max repeats reached (count = 3) -> should NOT trigger again
{
    const secondNotified = new Date('2026-09-30T08:40:00').toISOString();
    const now = new Date('2026-09-30T08:46:00');
    const state = { lastDate: '2026-09-30', count: 3, done: false, lastNotified: secondNotified };
    const res = background.evaluateAlertState(now, defaultSettings, state);
    assert.strictEqual(res.shouldNotify, false, 'Should not notify after 3 alerts');
    assert.strictEqual(res.nextState.count, 3);
}
console.log('✔ Passed: Notification stops when max repeat count (3) is reached');

// Case 2f: User already clicked / checked in (done = true) -> should NOT trigger
{
    const now = new Date('2026-09-30T08:35:00');
    const state = { lastDate: '2026-09-30', count: 1, done: true, lastNotified: new Date('2026-09-30T08:30:00').toISOString() };
    const res = background.evaluateAlertState(now, defaultSettings, state);
    assert.strictEqual(res.shouldNotify, false, 'Should not notify if done is true');
}
console.log('✔ Passed: Notification stops immediately once user marks done');

// Case 2g: New day resets state automatically
{
    const now = new Date('2026-10-01T08:30:00');
    const oldState = { lastDate: '2026-09-30', count: 3, done: true, lastNotified: '2026-09-30T08:45:00.000Z' };
    const res = background.evaluateAlertState(now, defaultSettings, oldState);
    assert.strictEqual(res.shouldNotify, true, 'Should trigger fresh alert on new date');
    assert.strictEqual(res.nextState.lastDate, '2026-10-01');
    assert.strictEqual(res.nextState.count, 1);
    assert.strictEqual(res.nextState.done, false);
}
console.log('✔ Passed: Automatically resets state on new day');

// Case 2h: Snooze = 0 (disabled repeat) -> only triggers initial alert
{
    const noSnoozeSettings = { ...defaultSettings, snoozeMinutes: 0 };
    const now1 = new Date('2026-09-30T08:30:00');
    const res1 = background.evaluateAlertState(now1, noSnoozeSettings, { lastDate: '2026-09-30', count: 0, done: false });
    assert.strictEqual(res1.shouldNotify, true);
    assert.strictEqual(res1.nextState.count, 1);

    const now2 = new Date('2026-09-30T08:40:00');
    const res2 = background.evaluateAlertState(now2, noSnoozeSettings, res1.nextState);
    assert.strictEqual(res2.shouldNotify, false, 'Should not snooze when snoozeMinutes is 0');
}
console.log('✔ Passed: Snooze=0 triggers only 1 initial notification');

// 3. Test URL sanitization helper
assert.strictEqual(typeof background.sanitizeAttendanceUrl, 'function', 'sanitizeAttendanceUrl should be a function');
assert.strictEqual(background.sanitizeAttendanceUrl('https://hrm.example.com'), 'https://hrm.example.com');
assert.strictEqual(background.sanitizeAttendanceUrl('hrm.example.com/checkin'), 'https://hrm.example.com/checkin');
assert.strictEqual(background.sanitizeAttendanceUrl('   http://my-company.vn   '), 'http://my-company.vn');
assert.strictEqual(background.sanitizeAttendanceUrl(''), '');
console.log('✔ Passed: sanitizeAttendanceUrl formats protocol correctly');

// 4. Test popup.html DOM elements
const fs = require('fs');
const popupHtml = fs.readFileSync(path.resolve(__dirname, '../popup/popup.html'), 'utf8');
const requiredIds = [
    'checkInEnabled',
    'checkInTime',
    'checkOutEnabled',
    'checkOutTime',
    'checkInOutSnooze',
    'checkInOutUrl',
    'testCheckInOutBtn',
    'saveCheckInOutBtn',
    'checkInOutSaveMsg'
];
requiredIds.forEach(id => {
    assert(popupHtml.includes(`id="${id}"`), `popup.html must contain id="${id}"`);
});
console.log('✔ Passed: All required Check-in/Check-out IDs exist in popup.html');

// 5. Test popup.css styles
const popupCss = fs.readFileSync(path.resolve(__dirname, '../popup/popup.css'), 'utf8');
const requiredClasses = [
    '.checkin-card',
    '.checkin-header',
    '.badge-workday',
    '.checkin-row',
    '.checkin-toggle-group',
    '.switch',
    '.slider.round',
    '.time-input',
    '.checkin-setting-row',
    '.snooze-select',
    '.url-input',
    '.checkin-actions'
];
requiredClasses.forEach(cls => {
    assert(popupCss.includes(cls), `popup.css must contain class ${cls}`);
});
console.log('✔ Passed: All required Check-in/Check-out CSS styles exist in popup.css');

// 6. Test popup.js initialization and event listeners
const popupJs = fs.readFileSync(path.resolve(__dirname, '../popup/popup.js'), 'utf8');
assert(popupJs.includes('initCheckInOutSettings'), 'popup.js must define initCheckInOutSettings');
assert(popupJs.includes('saveCheckInOutBtn'), 'popup.js must wire saveCheckInOutBtn');
assert(popupJs.includes('testCheckInOutBtn'), 'popup.js must wire testCheckInOutBtn');
console.log('✔ Passed: popup.js properly wires Check-in/Check-out settings and buttons');

console.log('\n🎉 ALL CHECK-IN / CHECK-OUT TESTS PASSED SUCCESSFULLY!');

