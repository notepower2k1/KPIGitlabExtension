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

    // --- Task 2: Background Service Worker Scheduler, Alarm & Notification Tests ---
    console.log('\n--- Testing Task 2: Background Service Worker Scheduler & Notifications ---');

    let mockStorage = {};
    let createdNotifications = [];
    let clearedNotifications = [];
    let createdTabs = [];
    let actionBadge = { text: null, color: null };
    let openPopupCalled = false;
    let openPopupShouldThrow = false;

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
            create: (id, options) => {
                createdNotifications.push({ id, ...options });
            },
            clear: (id) => {
                clearedNotifications.push(id);
            },
            onClicked: { addListener: () => {} }
        },
        action: {
            setBadgeText: ({ text }) => {
                actionBadge.text = text;
            },
            setBadgeBackgroundColor: ({ color }) => {
                actionBadge.color = color;
            },
            openPopup: async () => {
                openPopupCalled = true;
                if (openPopupShouldThrow) throw new Error('openPopup failed');
            }
        },
        storage: {
            local: {
                get: async (keys) => {
                    if (typeof keys === 'string') {
                        return { [keys]: mockStorage[keys] };
                    }
                    if (Array.isArray(keys)) {
                        const result = {};
                        keys.forEach(k => {
                            if (mockStorage[k] !== undefined) result[k] = mockStorage[k];
                        });
                        return result;
                    }
                    return { ...mockStorage };
                },
                set: async (obj) => {
                    Object.assign(mockStorage, obj);
                },
                remove: async (keys) => {
                    const arr = Array.isArray(keys) ? keys : [keys];
                    arr.forEach(k => delete mockStorage[k]);
                }
            }
        },
        tabs: {
            create: (opts) => {
                createdTabs.push(opts);
            }
        }
    };

    const background = require('../background.js');

    // 2.1 Function existence & export
    assert.strictEqual(
        typeof background.checkUnaddedKpiTasksReminder,
        'function',
        'checkUnaddedKpiTasksReminder should be exported by background.js'
    );

    // Mock API fetcher for background scheduler tests
    const mockGitlabFetch = async (url) => {
        return {
            ok: true,
            json: async () => [
                {
                    id: 101,
                    iid: 11,
                    title: 'Task 1 (Already added)',
                    web_url: 'https://gitlab.example.com/team/repo/-/issues/11',
                    created_at: '2026-10-01T08:00:00Z'
                },
                {
                    id: 102,
                    iid: 12,
                    title: 'Task 2 (Unadded)',
                    web_url: 'https://gitlab.example.com/team/repo/-/issues/12',
                    created_at: '2026-10-01T09:00:00Z'
                }
            ]
        };
    };

    // 2.2 Triggers when time reaches reminder window, stores UnaddedTodayTasks, sets badge '!', creates notification
    {
        mockStorage = {
            AccessToken: 'token-abc',
            gitlabUrl: 'https://gitlab.example.com',
            checkOutTime: '18:00',
            kpiReminderMinutesBefore: 15,
            kpiReminderEnabled: true,
            WorkItemIds: [
                { id: '11', href: 'https://gitlab.example.com/team/repo/-/issues/11' }
            ],
            kpiReminderState: {}
        };
        createdNotifications = [];
        actionBadge = { text: null, color: null };

        const triggerTime = new Date('2026-10-01T17:45:00'); // Thursday 17:45 (15 mins before 18:00)
        await background.checkUnaddedKpiTasksReminder(triggerTime, mockGitlabFetch);

        // Check storage contains UnaddedTodayTasks with Task 2
        assert.ok(Array.isArray(mockStorage.UnaddedTodayTasks), 'UnaddedTodayTasks should be stored');
        assert.strictEqual(mockStorage.UnaddedTodayTasks.length, 1, 'Should have 1 unadded task');
        assert.strictEqual(mockStorage.UnaddedTodayTasks[0].id, '102');
        assert.strictEqual(mockStorage.UnaddedTodayTasks[0].title, 'Task 2 (Unadded)');

        // Check badge
        assert.strictEqual(actionBadge.text, '!', 'Badge text should be set to "!"');
        assert.strictEqual(actionBadge.color, '#f59e0b', 'Badge color should be #f59e0b');

        // Check notification
        assert.strictEqual(createdNotifications.length, 1, 'Should create 1 notification');
        const notif = createdNotifications[0];
        assert.strictEqual(notif.id, 'kpi-unadded-alert');
        assert.ok(notif.title.includes('Nhắc nhở KPI'), 'Notification title should match');
        assert.ok(notif.message.includes('1 task'), 'Notification message should indicate 1 unadded task');
        assert.strictEqual(notif.priority, 2);
        assert.strictEqual(notif.requireInteraction, true);

        // Check state persisted
        assert.strictEqual(mockStorage.kpiReminderState.count, 1);
        assert.strictEqual(mockStorage.kpiReminderState.lastDate, '2026-10-01');
        console.log('✔ Passed: Triggered reminder sets storage, badge "!", and desktop notification');
    }

    // 2.3 Clears badge and UnaddedTodayTasks when 0 unadded tasks
    {
        mockStorage = {
            AccessToken: 'token-abc',
            gitlabUrl: 'https://gitlab.example.com',
            checkOutTime: '18:00',
            kpiReminderMinutesBefore: 15,
            kpiReminderEnabled: true,
            WorkItemIds: [
                { id: '11', href: 'https://gitlab.example.com/team/repo/-/issues/11' },
                { id: '12', href: 'https://gitlab.example.com/team/repo/-/issues/12' }
            ],
            UnaddedTodayTasks: [{ id: '102', title: 'Task 2' }],
            kpiReminderState: { lastDate: '2026-10-01', count: 1, done: false }
        };
        createdNotifications = [];
        actionBadge = { text: '!', color: '#f59e0b' };

        const checkTime = new Date('2026-10-01T17:50:00');
        await background.checkUnaddedKpiTasksReminder(checkTime, mockGitlabFetch);

        // UnaddedTodayTasks should be cleared or set to empty array
        assert.deepStrictEqual(mockStorage.UnaddedTodayTasks, [], 'UnaddedTodayTasks should be empty array');
        assert.strictEqual(actionBadge.text, '', 'Badge text should be cleared to ""');
        assert.strictEqual(createdNotifications.length, 0, 'No notification should be created when 0 unadded tasks');
        console.log('✔ Passed: 0 unadded tasks clears badge and empty UnaddedTodayTasks array');
    }

    // 2.4 Snooze cooldown: within 10 minutes, should scan but not send duplicate notification
    {
        mockStorage = {
            AccessToken: 'token-abc',
            gitlabUrl: 'https://gitlab.example.com',
            checkOutTime: '18:00',
            kpiReminderMinutesBefore: 15,
            kpiReminderEnabled: true,
            WorkItemIds: [
                { id: '11', href: 'https://gitlab.example.com/team/repo/-/issues/11' }
            ],
            kpiReminderState: {
                lastDate: '2026-10-01',
                count: 1,
                done: false,
                lastNotified: new Date('2026-10-01T17:45:00').toISOString()
            }
        };
        createdNotifications = [];
        actionBadge = { text: null, color: null };

        const snoozeTime = new Date('2026-10-01T17:48:00'); // 3 minutes later
        await background.checkUnaddedKpiTasksReminder(snoozeTime, mockGitlabFetch);

        assert.strictEqual(mockStorage.UnaddedTodayTasks.length, 1);
        assert.strictEqual(actionBadge.text, '!');
        assert.strictEqual(createdNotifications.length, 0, 'Should not dispatch notification during snooze cooldown');
        console.log('✔ Passed: Snooze cooldown suppresses duplicate notification while maintaining badge');
    }

    // 2.5 Graceful exit when AccessToken is missing
    {
        mockStorage = {
            AccessToken: '',
            kpiReminderEnabled: true,
            checkOutTime: '18:00',
            kpiReminderMinutesBefore: 15,
            kpiReminderState: {}
        };
        createdNotifications = [];
        actionBadge = { text: null, color: null };

        const triggerTime = new Date('2026-10-01T17:45:00');
        await background.checkUnaddedKpiTasksReminder(triggerTime, mockGitlabFetch);

        assert.strictEqual(createdNotifications.length, 0);
        assert.strictEqual(actionBadge.text, null);
        console.log('✔ Passed: Missing AccessToken exits gracefully');
    }

    // 2.6 Notification click routing for kpi-unadded-alert
    {
        clearedNotifications = [];
        createdTabs = [];
        openPopupCalled = false;
        openPopupShouldThrow = false;

        // When openPopup succeeds
        await background.handleNotificationClick('kpi-unadded-alert');
        assert.ok(clearedNotifications.includes('kpi-unadded-alert'), 'Must clear notification');
        assert.strictEqual(openPopupCalled, true, 'Must call chrome.action.openPopup');
        assert.strictEqual(createdTabs.length, 0, 'Must not open tab if openPopup succeeded');

        // When openPopup throws, falls back to chrome.tabs.create with popup/popup.html
        clearedNotifications = [];
        createdTabs = [];
        openPopupCalled = false;
        openPopupShouldThrow = true;

        await background.handleNotificationClick('kpi-unadded-alert');
        assert.ok(clearedNotifications.includes('kpi-unadded-alert'), 'Must clear notification');
        assert.strictEqual(createdTabs.length, 1, 'Must fallback to chrome.tabs.create when openPopup fails');
        assert.ok(createdTabs[0].url.includes('popup/popup.html'), 'Tab URL must point to popup/popup.html');
        console.log('✔ Passed: handleNotificationClick correctly routes kpi-unadded-alert and falls back to tab');
    }

    // --- Task 3: Popup Extension Warning Banner, Task List & 1-Click Batch Add Tests ---
    console.log('\n--- Testing Task 3: Popup Warning Banner, Task List & Batch Add ---');

    const fs = require('fs');
    const path = require('path');

    // 3.1 Verify popup.html DOM elements
    const popupHtml = fs.readFileSync(path.resolve(__dirname, '../popup/popup.html'), 'utf8');
    const requiredHtmlElements = [
        'unaddedKpiBanner',
        'unaddedKpiTitle',
        'toggleUnaddedListBtn',
        'addAllUnaddedKpiBtn',
        'unaddedKpiItemsList',
        'kpiReminderEnabled',
        'kpiReminderMinutesBefore'
    ];
    requiredHtmlElements.forEach(id => {
        assert(popupHtml.includes(`id="${id}"`), `popup.html must contain id="${id}"`);
    });
    console.log('✔ Passed: All required Task 3 DOM elements exist in popup.html');

    // 3.2 Verify popup.css CSS classes
    const popupCss = fs.readFileSync(path.resolve(__dirname, '../popup/popup.css'), 'utf8');
    const requiredCssClasses = [
        '.unadded-kpi-banner',
        '.unadded-kpi-header',
        '.unadded-kpi-actions',
        '.btn-warning-sm',
        '.unadded-kpi-items-list',
        '.unadded-kpi-item',
        '.unadded-kpi-item-title',
        '.unadded-kpi-add-btn'
    ];
    requiredCssClasses.forEach(cls => {
        assert(popupCss.includes(cls), `popup.css must contain CSS class ${cls}`);
    });
    console.log('✔ Passed: All required Task 3 CSS styles exist in popup.css');

    // 3.3 Verify popup.js exports
    const popupModule = require('../popup/popup.js');
    assert.strictEqual(
        typeof popupModule.renderUnaddedKpiBanner,
        'function',
        'renderUnaddedKpiBanner should be exported by popup.js'
    );
    assert.strictEqual(
        typeof popupModule.batchAddTasksToWorkItemIds,
        'function',
        'batchAddTasksToWorkItemIds should be exported by popup.js'
    );
    console.log('✔ Passed: popup.js exports required helper functions');

    // 3.4 Test batchAddTasksToWorkItemIds
    const currentItems = [
        { id: '11', href: 'https://gitlab.example.com/team/repo/-/issues/11', title: 'Task 11' }
    ];
    const incomingTasks = [
        { id: '11', iid: '11', href: 'https://gitlab.example.com/team/repo/-/work_items/11', title: 'Task 11 Duplicate' },
        { id: '102', iid: '12', href: 'https://gitlab.example.com/team/repo/-/issues/12', title: 'Task 12' },
        { id: '103', iid: '13', href: 'https://gitlab.example.com/team/repo/-/issues/13', title: 'Task 13' }
    ];
    const merged = popupModule.batchAddTasksToWorkItemIds(incomingTasks, currentItems);
    assert.strictEqual(merged.length, 3, 'Should add 2 new tasks and skip duplicate');
    assert.strictEqual(merged[0].id, '11');
    assert.strictEqual(merged[1].id, '102');
    assert.strictEqual(merged[2].id, '103');
    console.log('✔ Passed: batchAddTasksToWorkItemIds deduplicates and merges correctly');

    // 3.5 Test renderUnaddedKpiBanner with mock DOM
    function createMockElement(tagName = 'div') {
        const children = [];
        const attributes = {};
        return {
            tagName,
            style: {},
            children,
            textContent: '',
            innerHTML: '',
            setAttribute(k, v) { attributes[k] = String(v); },
            getAttribute(k) { return attributes[k]; },
            appendChild(child) { children.push(child); }
        };
    }

    const mockBanner = createMockElement('div');
    const mockTitle = createMockElement('span');
    const mockList = createMockElement('div');

    const mockDoc = {
        getElementById(id) {
            if (id === 'unaddedKpiBanner') return mockBanner;
            if (id === 'unaddedKpiTitle') return mockTitle;
            if (id === 'unaddedKpiItemsList') return mockList;
            return null;
        },
        createElement(tag) {
            return createMockElement(tag);
        }
    };

    // Render with 2 tasks
    const testTasks = [
        { id: '101', iid: '1', title: 'Feature Alpha', href: 'https://gitlab.example.com/prj/-/issues/1' },
        { id: '102', iid: '2', title: 'Bug Beta', href: 'https://gitlab.example.com/prj/-/issues/2' }
    ];
    popupModule.renderUnaddedKpiBanner(testTasks, mockDoc);
    assert.strictEqual(mockBanner.style.display, 'block', 'Banner should be displayed when tasks exist');
    assert.ok(mockTitle.textContent.includes('2 task'), 'Title should state 2 tasks');
    assert.strictEqual(mockList.children.length, 2, 'Should create 2 item elements');
    assert.strictEqual(mockList.children[0].children[0].getAttribute('href'), 'https://gitlab.example.com/prj/-/issues/1');
    assert.strictEqual(mockList.children[0].children[1].getAttribute('data-task-id'), '101');
    assert.strictEqual(mockList.children[1].children[1].getAttribute('data-task-id'), '102');

    // Render with 0 tasks (empty array)
    actionBadge = { text: '!' };
    popupModule.renderUnaddedKpiBanner([], mockDoc);
    assert.strictEqual(mockBanner.style.display, 'none', 'Banner should be hidden when empty');
    assert.strictEqual(actionBadge.text, '', 'Badge should be cleared when empty');
    console.log('✔ Passed: renderUnaddedKpiBanner properly updates DOM and badge');

    // 3.6 Test popup.js contains required event listeners and settings logic
    const popupJsContent = fs.readFileSync(path.resolve(__dirname, '../popup/popup.js'), 'utf8');
    assert(popupJsContent.includes('addAllUnaddedKpiBtn'), 'popup.js must handle addAllUnaddedKpiBtn');
    assert(popupJsContent.includes('toggleUnaddedListBtn'), 'popup.js must handle toggleUnaddedListBtn');
    assert(popupJsContent.includes('kpiReminderEnabled'), 'popup.js must reference kpiReminderEnabled');
    assert(popupJsContent.includes('kpiReminderMinutesBefore'), 'popup.js must reference kpiReminderMinutesBefore');
    assert(popupJsContent.includes('UnaddedTodayTasks'), 'popup.js must handle UnaddedTodayTasks');
    console.log('✔ Passed: popup.js contains all required handlers and settings logic');

    console.log('\n🎉 ALL TASK 1, TASK 2 & TASK 3 TESTS PASSED SUCCESSFULLY!');
})();

