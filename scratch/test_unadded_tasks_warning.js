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
assert.strictEqual(typeof getTodayStartIso, 'function', 'getTodayStartIso should be a function');
assert.strictEqual(typeof filterUnaddedTasks, 'function', 'filterUnaddedTasks should be a function');
assert.strictEqual(typeof evaluateKpiReminderState, 'function', 'evaluateKpiReminderState should be a function');
assert.strictEqual(typeof fetchTodayCreatedIssues, 'function', 'fetchTodayCreatedIssues should be a function');

// 2. getTodayStartIso returns ISO string representing 00:00:00.000 local time
const testDate = new Date(2026, 9, 1, 15, 30, 0); // 2026-10-01 15:30 local time
const todayIso = getTodayStartIso(testDate);
const parsedMidnight = new Date(todayIso);
assert.strictEqual(parsedMidnight.getFullYear(), 2026);
assert.strictEqual(parsedMidnight.getMonth(), 9);
assert.strictEqual(parsedMidnight.getDate(), 1);
assert.strictEqual(parsedMidnight.getHours(), 0);
assert.strictEqual(parsedMidnight.getMinutes(), 0);
assert.strictEqual(parsedMidnight.getSeconds(), 0);

// Default parameter test for getTodayStartIso
const defaultIso = getTodayStartIso();
const defaultParsed = new Date(defaultIso);
const nowCheck = new Date();
assert.strictEqual(defaultParsed.getFullYear(), nowCheck.getFullYear());
assert.strictEqual(defaultParsed.getMonth(), nowCheck.getMonth());
assert.strictEqual(defaultParsed.getDate(), nowCheck.getDate());
assert.strictEqual(defaultParsed.getHours(), 0);

// Invalid date parameter fallback
const invalidDateIso = getTodayStartIso(new Date('invalid'));
const invalidParsed = new Date(invalidDateIso);
assert.strictEqual(invalidParsed.getFullYear(), nowCheck.getFullYear());
assert.strictEqual(invalidParsed.getMonth(), nowCheck.getMonth());
assert.strictEqual(invalidParsed.getDate(), nowCheck.getDate());
assert.strictEqual(invalidParsed.getHours(), 0);

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
assert.strictEqual(unadded[0].iid, '12');
assert.strictEqual(unadded[0].title, 'Task 2');
assert.strictEqual(unadded[0].href, 'https://gitlab.com/grp/prj/-/issues/12');
assert.deepStrictEqual(filterUnaddedTasks([], []), []);
assert.deepStrictEqual(filterUnaddedTasks(null, null), []);
assert.deepStrictEqual(filterUnaddedTasks(undefined, undefined), []);

// Edge case: empty stored list returns all issues normalized
const allUnadded = filterUnaddedTasks(mockApiIssues, []);
assert.strictEqual(allUnadded.length, 3);

// Cross-project IID isolation test: IID 12 in Prj A must not match IID 12 in Prj B
const crossProjectApiIssues = [
    { id: 201, iid: 12, title: 'Task in Prj A', web_url: 'https://gitlab.com/grp/prj-a/-/issues/12', created_at: '2026-10-01T09:00:00Z' }
];
const storedPrjB = [
    { id: '12', href: 'https://gitlab.com/grp/prj-b/-/issues/12' }
];
const unaddedCrossPrj = filterUnaddedTasks(crossProjectApiIssues, storedPrjB);
assert.strictEqual(unaddedCrossPrj.length, 1, 'Task in prj-a must not match task in prj-b even with same IID 12');
assert.strictEqual(unaddedCrossPrj[0].id, '201');

// When project matches, it should be filtered out
const storedPrjA = [
    { id: '12', href: 'https://gitlab.com/grp/prj-a/-/work_items/12' }
];
const unaddedSamePrj = filterUnaddedTasks(crossProjectApiIssues, storedPrjA);
assert.strictEqual(unaddedSamePrj.length, 0, 'Task in prj-a should match stored work_item in prj-a');

// 4. evaluateKpiReminderState
// A. Weekend (Saturday): should not scan or notify
const saturday = new Date('2026-10-03T17:45:00');
const satResult = evaluateKpiReminderState(saturday, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, {});
assert.strictEqual(satResult.shouldScan, false);
assert.strictEqual(satResult.shouldNotify, false);

// Sunday: should not scan or notify
const sunday = new Date('2026-10-04T17:45:00');
const sunResult = evaluateKpiReminderState(sunday, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, {});
assert.strictEqual(sunResult.shouldScan, false);
assert.strictEqual(sunResult.shouldNotify, false);

// B. Weekday before reminder time (e.g. 17:30 with 15 mins before 18:00): should not scan
const thursdayEarly = new Date('2026-10-01T17:30:00');
const earlyResult = evaluateKpiReminderState(thursdayEarly, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, {});
assert.strictEqual(earlyResult.shouldScan, false);
assert.strictEqual(earlyResult.shouldNotify, false);

// C. Weekday at reminder window (17:45): should scan and notify
const thursdayTrigger = new Date('2026-10-01T17:45:00');
const triggerResult = evaluateKpiReminderState(thursdayTrigger, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, {});
assert.strictEqual(triggerResult.shouldScan, true);
assert.strictEqual(triggerResult.shouldNotify, true);
assert.strictEqual(triggerResult.nextState.count, 1);
assert.strictEqual(triggerResult.nextState.done, false);

// D. Already notified max times (e.g. count >= 2): should scan for UI refresh but should not dispatch sound/notification spam
const stateNotified = { lastDate: '2026-10-01', count: 2, done: false, lastNotified: thursdayTrigger.toISOString() };
const repeatResult = evaluateKpiReminderState(new Date('2026-10-01T17:50:00'), { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, stateNotified);
assert.strictEqual(repeatResult.shouldScan, true);
assert.strictEqual(repeatResult.shouldNotify, false);

// E. Feature disabled: should not scan or notify
const disabledResult = evaluateKpiReminderState(thursdayTrigger, { enabled: false, checkOutTime: '18:00', minutesBefore: 15 }, {});
assert.strictEqual(disabledResult.shouldScan, false);
assert.strictEqual(disabledResult.shouldNotify, false);

// F. Already marked done for today: should not scan or notify
const doneResult = evaluateKpiReminderState(thursdayTrigger, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, { lastDate: '2026-10-01', count: 1, done: true });
assert.strictEqual(doneResult.shouldScan, false);
assert.strictEqual(doneResult.shouldNotify, false);

// G. Date rollover: resets count and done from previous day
const nextDayState = { lastDate: '2026-09-30', count: 2, done: true, lastNotified: '2026-09-30T17:45:00.000Z' };
const rolloverResult = evaluateKpiReminderState(thursdayTrigger, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, nextDayState);
assert.strictEqual(rolloverResult.shouldScan, true);
assert.strictEqual(rolloverResult.shouldNotify, true);
assert.strictEqual(rolloverResult.nextState.count, 1);
assert.strictEqual(rolloverResult.nextState.done, false);

// H. Snooze cooldown with omitted snoozeMinutes (default 10 mins)
const firstAlertTime = new Date('2026-10-01T17:45:00');
const stateAfterFirstAlert = {
    lastDate: '2026-10-01',
    count: 1,
    done: false,
    lastNotified: firstAlertTime.toISOString()
};

// 1 minute later (17:46): within 10 min default snooze -> should NOT notify
const oneMinLater = new Date('2026-10-01T17:46:00');
const snoozeResult1 = evaluateKpiReminderState(oneMinLater, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, stateAfterFirstAlert);
assert.strictEqual(snoozeResult1.shouldScan, true);
assert.strictEqual(snoozeResult1.shouldNotify, false, 'Should not notify during default 10-minute snooze cooldown');

// 9 minutes later (17:54): within 10 min default snooze -> should NOT notify
const nineMinsLater = new Date('2026-10-01T17:54:00');
const snoozeResult9 = evaluateKpiReminderState(nineMinsLater, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, stateAfterFirstAlert);
assert.strictEqual(snoozeResult9.shouldScan, true);
assert.strictEqual(snoozeResult9.shouldNotify, false, 'Should not notify at 9 minutes during default snooze');

// 10 minutes later (17:55): snooze elapsed -> SHOULD notify (alert 2)
const tenMinsLater = new Date('2026-10-01T17:55:00');
const snoozeResult10 = evaluateKpiReminderState(tenMinsLater, { enabled: true, checkOutTime: '18:00', minutesBefore: 15 }, stateAfterFirstAlert);
assert.strictEqual(snoozeResult10.shouldScan, true);
assert.strictEqual(snoozeResult10.shouldNotify, true, 'Should notify after default 10-minute snooze elapsed');
assert.strictEqual(snoozeResult10.nextState.count, 2);

// 5. fetchTodayCreatedIssues network mock
const mockFetch = async (url, opts) => {
    assert.ok(url.includes('scope=created_by_me'), 'URL must include scope=created_by_me');
    assert.ok(url.includes('state=opened'), 'URL must include state=opened');
    assert.ok(url.includes('created_after='), 'URL must include created_after=');
    assert.strictEqual(opts.headers.Authorization, 'Bearer token123');
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
    assert.strictEqual(String(fetched[0].id), '999');

    // Error handling: missing token or baseUrl returns empty array
    const emptyResult1 = await fetchTodayCreatedIssues('', 'https://gitlab.com', '2026-10-01T00:00:00.000Z', mockFetch);
    assert.deepStrictEqual(emptyResult1, []);

    const emptyResult2 = await fetchTodayCreatedIssues('token123', '', '2026-10-01T00:00:00.000Z', mockFetch);
    assert.deepStrictEqual(emptyResult2, []);

    // Error handling: fetch failure returns empty array
    const failingFetch = async () => { throw new Error('Network error'); };
    const failedResult = await fetchTodayCreatedIssues('token123', 'https://gitlab.com', '2026-10-01T00:00:00.000Z', failingFetch);
    assert.deepStrictEqual(failedResult, []);

    console.log('✔ Task 1 assertions passed!');
})();
