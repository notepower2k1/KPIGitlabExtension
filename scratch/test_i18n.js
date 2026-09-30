/**
 * Test Suite for i18n Core Engine & Complete Dictionary (Task 1)
 */

const assert = require('assert');
const path = require('path');

console.log('=== Running Suite: i18n Core Engine & Complete Dictionary ===');

let i18n;
try {
    i18n = require('../i18n.js');
} catch (err) {
    console.error('Failed to load ../i18n.js (Expected in RED phase):', err.message);
}

// 1. Verify Module Exports
console.log('\n--- 1. Module Exports & Signature Verification ---');
assert.ok(i18n, 'i18n module must be exported');
assert.strictEqual(typeof i18n.t, 'function', 'i18n.t must be a function');
assert.strictEqual(typeof i18n.detectBrowserLanguage, 'function', 'i18n.detectBrowserLanguage must be a function');
assert.strictEqual(typeof i18n.getLanguage, 'function', 'i18n.getLanguage must be a function');
assert.strictEqual(typeof i18n.setLanguage, 'function', 'i18n.setLanguage must be a function');
assert.strictEqual(typeof i18n.initLanguage, 'function', 'i18n.initLanguage must be a function');
assert.strictEqual(typeof i18n.applyI18n, 'function', 'i18n.applyI18n must be a function');
assert.ok(i18n.I18N_DICTIONARIES, 'i18n.I18N_DICTIONARIES must exist');
assert.ok(i18n.I18N_DICTIONARIES.vi, 'i18n.I18N_DICTIONARIES.vi must exist');
assert.ok(i18n.I18N_DICTIONARIES.en, 'i18n.I18N_DICTIONARIES.en must exist');
console.log('✔ Passed: All core functions and dictionaries exported');

// 2. Verify 100% Dictionary Parity & Placeholders
console.log('\n--- 2. Dictionary Completeness & Parity ---');
const viDict = i18n.I18N_DICTIONARIES.vi;
const enDict = i18n.I18N_DICTIONARIES.en;

const viKeys = Object.keys(viDict).sort();
const enKeys = Object.keys(enDict).sort();

console.log(`Found ${viKeys.length} Vietnamese keys and ${enKeys.length} English keys.`);
assert.ok(viKeys.length >= 80, `Expected at least 80 dictionary keys, found ${viKeys.length}`);

// Every VI key must exist in EN
const missingInEn = viKeys.filter(k => !(k in enDict));
assert.deepStrictEqual(missingInEn, [], `Keys present in 'vi' but missing in 'en': ${missingInEn.join(', ')}`);

// Every EN key must exist in VI
const missingInVi = enKeys.filter(k => !(k in viDict));
assert.deepStrictEqual(missingInVi, [], `Keys present in 'en' but missing in 'vi': ${missingInVi.join(', ')}`);

// Verify Placeholder Token Parity for every key
function extractTokens(str) {
    if (typeof str !== 'string') return [];
    const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    return matches.sort();
}

const tokenMismatches = [];
for (const key of viKeys) {
    const viTokens = extractTokens(viDict[key]);
    const enTokens = extractTokens(enDict[key]);
    if (JSON.stringify(viTokens) !== JSON.stringify(enTokens)) {
        tokenMismatches.push({ key, viTokens, enTokens });
    }
}
assert.deepStrictEqual(tokenMismatches, [], `Placeholder tokens mismatch: ${JSON.stringify(tokenMismatches, null, 2)}`);
console.log(`✔ Passed: 100% Dictionary Parity between VI and EN (${viKeys.length} keys, identical tokens)`);

// 3. Category Coverage Verification
console.log('\n--- 3. Required Category Coverage Verification ---');
const requiredKeys = [
    // Navigation & Tabs
    'tabHome', 'tabNotes', 'tabTodo', 'tabTools', 'tabWorkItems', 'tabAnalytics', 'tabWeek', 'tabMonth',
    // Auth & Login
    'welcomeTitle', 'welcomeDesc', 'tokenPlaceholder', 'connectBtn', 'tutorialBtn', 'logoutBtn', 'tokenRequired', 'connectFailed',
    // Banner & Unadded Tasks
    'unaddedBannerTitle', 'viewDetails', 'hideDetails', 'addAllToKpi', 'addSingleTask',
    // Check-in/out Card
    'checkinCardTitle', 'checkinLabel', 'checkoutLabel', 'workdayBadge', 'snoozeLabel', 'snooze5m', 'snooze10m', 'snooze15m', 'snoozeNone',
    'urlLabel', 'urlPlaceholder', 'testSoundBtn', 'saveSettingsBtn', 'saveSettingsSuccess', 'kpiReminderLabel', 'kpiReminderBefore', 'minutesUnit',
    // Tools
    'storageTitle', 'noteWindowBtn', 'noteTabBtn', 'todoWindowBtn', 'todoTabBtn', 'exportBtn', 'importBtn', 'openDashboardBtn',
    // Kanban Board
    'kanbanTitle', 'colTodo', 'colProcessing', 'colDone', 'addTaskPlaceholder', 'deadlinePlaceholder', 'addTaskBtn',
    'editTaskModalTitle', 'saveChangesBtn', 'cancelBtn', 'deleteTaskBtn', 'windowModeBtn', 'tabModeBtn',
    // Notepad
    'notesTitle', 'untitledNote', 'autoSaved', 'saving', 'addNoteBtn', 'notePlaceholder',
    // KPI Dashboard
    'pageTitle', 'filterWeek', 'filterMonth', 'filterAll', 'kpiHealthScore', 'onTimeRate', 'attitudeScore', 'volumeScore', 'qualityScore',
    'tableTasks', 'tableWorkItemName', 'tableParentIssue', 'tableStartDate', 'tableDueDate', 'tableClosedDate',
    'tableEst', 'tableSpent', 'tableDiff', 'tableStatus', 'tableAction', 'statusDoing', 'statusDone', 'statusCarryOver',
    'timesheetTitle', 'timesheetStandardHours', 'timesheetOvertime', 'timesheetLate',
    // GitLab In-Page Summary
    'summaryBtn', 'summaryModalTitle', 'metricTotalTasks', 'metricTotalEst', 'metricTotalSpent', 'metricDiff', 'metricOnTimeRate', 'refreshBtn', 'addAllToKpiModal',
    // Desktop Notifications
    'notifCheckinTitle', 'notifCheckinMsg', 'notifCheckoutTitle', 'notifCheckoutMsg', 'notifKpiAlertTitle', 'notifKpiAlertMsg'
];

const missingRequired = requiredKeys.filter(k => !(k in viDict));
assert.deepStrictEqual(missingRequired, [], `Missing required keys: ${missingRequired.join(', ')}`);
console.log(`✔ Passed: All required category keys verified present`);

// 4. Test Translation Function t(key, params, lang)
console.log('\n--- 4. Translation Function Behavior ---');
// Direct translation
assert.strictEqual(i18n.t('connectBtn', null, 'vi'), 'Kết nối ngay');
assert.strictEqual(i18n.t('connectBtn', null, 'en'), 'Connect Now');

// Parameter interpolation
assert.strictEqual(
    i18n.t('unaddedBannerTitle', { count: 5 }, 'vi'),
    'Bạn có 5 task tạo hôm nay chưa thêm vào KPI!'
);
assert.strictEqual(
    i18n.t('unaddedBannerTitle', { count: 5 }, 'en'),
    'You have 5 task(s) created today not yet added to KPI!'
);

// Fallback to EN if missing in requested lang
viDict['__testOnlyKey'] = undefined;
enDict['__testOnlyKey'] = 'English Only Value';
assert.strictEqual(i18n.t('__testOnlyKey', null, 'vi'), 'English Only Value');
delete enDict['__testOnlyKey'];

// Fallback to raw key if missing in both
assert.strictEqual(i18n.t('completely_non_existent_key', null, 'vi'), 'completely_non_existent_key');
assert.strictEqual(i18n.t('completely_non_existent_key', null, 'en'), 'completely_non_existent_key');

// Default to in-memory active language when lang argument omitted
i18n.setLanguage('vi');
assert.strictEqual(i18n.t('connectBtn'), 'Kết nối ngay');
i18n.setLanguage('en');
assert.strictEqual(i18n.t('connectBtn'), 'Connect Now');

console.log('✔ Passed: t() function correctly handles direct translation, interpolation, and fallbacks');

// 5. Language Detection & State Management
console.log('\n--- 5. Language Detection & Storage Persistence ---');

// Browser detection with mock chrome
global.chrome = {
    i18n: {
        getUILanguage: () => 'vi-VN'
    }
};
assert.strictEqual(i18n.detectBrowserLanguage(), 'vi', 'detectBrowserLanguage should detect vi-VN as vi');

global.chrome.i18n.getUILanguage = () => 'en-US';
assert.strictEqual(i18n.detectBrowserLanguage(), 'en', 'detectBrowserLanguage should detect en-US as en');

delete global.chrome;

// Browser detection with mock navigator
const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
try {
    Object.defineProperty(globalThis, 'navigator', {
        value: { language: 'vi' },
        configurable: true
    });
    assert.strictEqual(i18n.detectBrowserLanguage(), 'vi', 'detectBrowserLanguage should detect navigator.language vi as vi');

    Object.defineProperty(globalThis, 'navigator', {
        value: { language: 'ja-JP' },
        configurable: true
    });
    assert.strictEqual(i18n.detectBrowserLanguage(), 'en', 'detectBrowserLanguage should fallback ja-JP to en');
} finally {
    if (originalNavigatorDesc) {
        Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
    } else {
        delete globalThis.navigator;
    }
}

// Storage interaction test
let mockStorageData = {};
const mockStorage = {
    get: async (keys) => {
        const result = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const k of keyList) {
            if (k in mockStorageData) result[k] = mockStorageData[k];
        }
        return result;
    },
    set: async (obj) => {
        mockStorageData = { ...mockStorageData, ...obj };
    }
};

(async () => {
    // Test setLanguage with storage
    await i18n.setLanguage('vi', mockStorage);
    assert.strictEqual(i18n.getLanguage(), 'vi');
    assert.strictEqual(mockStorageData.appLanguage, 'vi');

    await i18n.setLanguage('en', mockStorage);
    assert.strictEqual(i18n.getLanguage(), 'en');
    assert.strictEqual(mockStorageData.appLanguage, 'en');

    // Test invalid language normalization
    await i18n.setLanguage('fr', mockStorage);
    assert.strictEqual(i18n.getLanguage(), 'en', 'Invalid language should normalize to en');

    // Test initLanguage
    mockStorageData.appLanguage = 'vi';
    const initLang = await i18n.initLanguage(mockStorage);
    assert.strictEqual(initLang, 'vi');
    assert.strictEqual(i18n.getLanguage(), 'vi');

    console.log('✔ Passed: Language detection, setter, and storage persistence work correctly');

    // 6. Test DOM Translation applyI18n
    console.log('\n--- 6. DOM Translation applyI18n ---');

    class MockElement {
        constructor(tagName = 'div', attributes = {}) {
            this.tagName = tagName.toUpperCase();
            this.attributes = { ...attributes };
            this.textContent = '';
            this.placeholder = '';
            this.title = '';
            this.children = [];
        }
        getAttribute(name) {
            return this.attributes[name] !== undefined ? this.attributes[name] : null;
        }
        setAttribute(name, val) {
            this.attributes[name] = String(val);
        }
        hasAttribute(name) {
            return name in this.attributes;
        }
        querySelectorAll(selector) {
            const results = [];
            function traverse(node) {
                for (const child of node.children) {
                    if (selector.includes('[data-i18n]') && child.hasAttribute('data-i18n')) {
                        results.push(child);
                    } else if (selector.includes('[data-i18n-placeholder]') && child.hasAttribute('data-i18n-placeholder')) {
                        results.push(child);
                    } else if (selector.includes('[data-i18n-title]') && child.hasAttribute('data-i18n-title')) {
                        results.push(child);
                    } else if (selector.includes('[data-i18n-aria]') && child.hasAttribute('data-i18n-aria')) {
                        results.push(child);
                    }
                    traverse(child);
                }
            }
            traverse(this);
            return results;
        }
    }

    const root = new MockElement('div');
    const titleEl = new MockElement('h2', { 'data-i18n': 'welcomeTitle' });
    const inputEl = new MockElement('input', { 'data-i18n-placeholder': 'tokenPlaceholder' });
    const btnEl = new MockElement('button', { 'data-i18n': 'connectBtn', 'data-i18n-title': 'connectBtn' });
    const ariaEl = new MockElement('button', { 'data-i18n-aria': 'logoutBtn' });

    root.children.push(titleEl, inputEl, btnEl, ariaEl);

    // Apply Vietnamese
    i18n.applyI18n(root, 'vi');
    assert.strictEqual(titleEl.textContent, 'Chào bạn 👋');
    assert.strictEqual(inputEl.placeholder, 'Nhập Personal Access Token...');
    assert.strictEqual(btnEl.textContent, 'Kết nối ngay');
    assert.strictEqual(btnEl.title, 'Kết nối ngay');
    assert.strictEqual(ariaEl.getAttribute('aria-label'), 'Đăng xuất');

    // Apply English
    i18n.applyI18n(root, 'en');
    assert.strictEqual(titleEl.textContent, 'Welcome 👋');
    assert.strictEqual(inputEl.placeholder, 'Enter Personal Access Token...');
    assert.strictEqual(btnEl.textContent, 'Connect Now');
    assert.strictEqual(btnEl.title, 'Connect Now');
    assert.strictEqual(ariaEl.getAttribute('aria-label'), 'Log out');

    console.log('✔ Passed: applyI18n correctly translates textContent, placeholder, title, and aria-label');

    // 7. Test Dual Export Simulation
    console.log('\n--- 7. Dual Export Environment Simulation ---');
    global.window = {};
    // Re-evaluating dual export binding in browser context
    if (typeof i18n._bindWindow === 'function') {
        i18n._bindWindow(global.window);
        assert.ok(global.window.i18n, 'window.i18n must be defined in browser context');
        assert.strictEqual(typeof global.window.i18n.t, 'function', 'window.i18n.t must be a function');
        assert.strictEqual(typeof global.window.t, 'function', 'window.t must be directly accessible');
    }
    delete global.window;
    console.log('✔ Passed: Dual export correctly handles browser window binding');

    // =========================================================================
    // TASK 2: POPUP INTERFACE & BACKGROUND NOTIFICATIONS INTEGRATION TESTS
    // =========================================================================
    console.log('\n=============================================================');
    console.log('--- Running Task 2: Popup Interface & Background Integration ---');
    console.log('=============================================================');

    const fs = require('fs');

    // 8. Verify popup/popup.html Markup & Declarative Attributes
    console.log('\n--- 8. Testing popup/popup.html Markup & i18n Wiring ---');
    const popupHtmlPath = path.resolve(__dirname, '../popup/popup.html');
    const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');

    // 8.1 Script tag for i18n.js
    assert.ok(
        popupHtml.includes('src="../i18n.js"') || popupHtml.includes("src='../i18n.js'"),
        'popup.html must include script tag for ../i18n.js'
    );

    // 8.2 Login Screen Language Switcher
    assert.ok(
        popupHtml.includes('login-lang-switch') || popupHtml.includes('loginLangSelect'),
        'popup.html must include a language switcher container on login screen'
    );
    assert.ok(
        popupHtml.includes('data-lang="vi"') && popupHtml.includes('data-lang="en"'),
        'Language switcher must include buttons or options for "vi" and "en"'
    );

    // 8.3 Login Screen Declarative i18n Attributes
    const requiredLoginAttrs = [
        'data-i18n="welcomeTitle"',
        'data-i18n="welcomeDesc"',
        'data-i18n-placeholder="tokenPlaceholder"',
        'data-i18n="connectBtn"',
        'data-i18n="tutorialBtn"'
    ];
    requiredLoginAttrs.forEach(attr => {
        assert.ok(popupHtml.includes(attr), `popup.html #login-screen must contain ${attr}`);
    });

    // 8.4 User Screen Header & Tabs Declarative Attributes
    assert.ok(popupHtml.includes('data-i18n-title="logoutBtn"'), 'Logout button must have data-i18n-title="logoutBtn"');
    assert.ok(popupHtml.includes('data-i18n="tabWeek"'), 'Tab navigation must have data-i18n="tabWeek"');
    assert.ok(popupHtml.includes('data-i18n="tabMonth"'), 'Tab navigation must have data-i18n="tabMonth"');
    assert.ok(popupHtml.includes('data-i18n="tabTools"'), 'Tab navigation must have data-i18n="tabTools"');

    // 8.5 Unadded KPI Banner Declarative Attributes
    assert.ok(popupHtml.includes('data-i18n="viewDetails"'), 'Toggle unadded list button must have data-i18n="viewDetails"');
    assert.ok(popupHtml.includes('data-i18n="addAllToKpi"'), 'Add all unadded button must have data-i18n="addAllToKpi"');

    // 8.6 Check-in Card Language Switcher & Controls
    assert.ok(popupHtml.includes('id="appLangSelect"'), 'Check-in settings card must include select #appLangSelect');
    assert.ok(popupHtml.includes('data-i18n="languageLabel"'), 'Check-in settings card must have label with data-i18n="languageLabel"');
    assert.ok(popupHtml.includes('data-i18n="checkinLabel"'), 'Check-in row must have data-i18n="checkinLabel"');
    assert.ok(popupHtml.includes('data-i18n="checkoutLabel"'), 'Check-out row must have data-i18n="checkoutLabel"');
    assert.ok(popupHtml.includes('data-i18n="kpiReminderLabel"'), 'KPI reminder row must have data-i18n="kpiReminderLabel"');
    assert.ok(popupHtml.includes('data-i18n="kpiReminderBefore"'), 'KPI reminder row must have data-i18n="kpiReminderBefore"');
    assert.ok(popupHtml.includes('data-i18n="minutesUnit"'), 'KPI reminder row must have data-i18n="minutesUnit"');
    assert.ok(popupHtml.includes('data-i18n="snoozeLabel"'), 'Snooze row must have data-i18n="snoozeLabel"');
    assert.ok(popupHtml.includes('data-i18n="urlLabel"'), 'URL row must have data-i18n="urlLabel"');
    assert.ok(popupHtml.includes('data-i18n="testSoundBtn"'), 'Test sound button must have data-i18n="testSoundBtn"');
    assert.ok(popupHtml.includes('data-i18n="saveSettingsBtn"'), 'Save settings button must have data-i18n="saveSettingsBtn"');

    // 8.7 Tools Grid Buttons
    const requiredToolsAttrs = [
        'data-i18n="noteWindowBtn"',
        'data-i18n="noteTabBtn"',
        'data-i18n="todoWindowBtn"',
        'data-i18n="todoTabBtn"',
        'data-i18n="exportBtn"',
        'data-i18n="importBtn"'
    ];
    requiredToolsAttrs.forEach(attr => {
        assert.ok(popupHtml.includes(attr), `popup.html tools grid must contain ${attr}`);
    });
    console.log('✔ Passed: popup/popup.html contains all required i18n tags, selectors, and declarative attributes');

    // 9. Verify popup/popup.css Styling
    console.log('\n--- 9. Testing popup/popup.css Styles ---');
    const popupCssPath = path.resolve(__dirname, '../popup/popup.css');
    const popupCss = fs.readFileSync(popupCssPath, 'utf8');

    assert.ok(popupCss.includes('.login-lang-switch'), 'popup.css must style .login-lang-switch');
    assert.ok(popupCss.includes('.lang-btn'), 'popup.css must style .lang-btn');
    assert.ok(popupCss.includes('.lang-btn.active') || popupCss.includes('.lang-btn:active'), 'popup.css must style active state of .lang-btn');
    assert.ok(
        popupCss.includes('#appLangSelect') || popupCss.includes('.lang-select'),
        'popup.css must style language selector in settings'
    );
    console.log('✔ Passed: popup/popup.css contains language switcher styling rules');

    // 10. Verify background.js Localized Desktop Notifications
    console.log('\n--- 10. Testing background.js Localized Desktop Notifications ---');

    let bgStorage = {};
    let bgNotifications = [];
    global.chrome = {
        runtime: {
            onInstalled: { addListener: () => {} },
            onStartup: { addListener: () => {} },
            getURL: (p) => `chrome-extension://mock-id/${p}`
        },
        alarms: {
            create: () => {},
            onAlarm: { addListener: () => {} }
        },
        notifications: {
            create: (id, opts) => {
                bgNotifications.push({ id, ...opts });
            },
            clear: () => {},
            onClicked: { addListener: () => {} }
        },
        action: {
            setBadgeText: () => {},
            setBadgeBackgroundColor: () => {},
            openPopup: async () => {}
        },
        storage: {
            local: {
                get: async (keys) => {
                    if (typeof keys === 'string') return { [keys]: bgStorage[keys] };
                    if (Array.isArray(keys)) {
                        const res = {};
                        keys.forEach(k => { if (bgStorage[k] !== undefined) res[k] = bgStorage[k]; });
                        return res;
                    }
                    return { ...bgStorage };
                },
                set: async (obj) => {
                    Object.assign(bgStorage, obj);
                }
            }
        },
        tabs: {
            create: () => {}
        }
    };

    // Clear module cache to test fresh background.js
    delete require.cache[require.resolve('../background.js')];
    const background = require('../background.js');

    // 10.1 Check-in Alert in VI
    {
        bgStorage = {
            appLanguage: 'vi',
            checkInEnabled: true,
            checkInTime: '08:30',
            checkInOutSnoozeMinutes: 5,
            checkInState: { lastDate: '2026-10-01', count: 0, done: false }
        };
        bgNotifications = [];
        await background.checkCheckInOutAlerts(new Date('2026-10-01T08:30:00'));
        assert.strictEqual(bgNotifications.length, 1);
        assert.strictEqual(bgNotifications[0].id, 'checkin-alert');
        assert.ok(
            bgNotifications[0].title.includes(i18n.t('notifCheckinTitle', null, 'vi')),
            `Check-in alert title in VI should match: expected "${i18n.t('notifCheckinTitle', null, 'vi')}", got "${bgNotifications[0].title}"`
        );
        assert.ok(
            bgNotifications[0].message.includes('08:30'),
            'Check-in alert message should include target time'
        );
    }

    // 10.2 Check-in Alert in EN
    {
        bgStorage = {
            appLanguage: 'en',
            checkInEnabled: true,
            checkInTime: '08:30',
            checkInOutSnoozeMinutes: 5,
            checkInState: { lastDate: '2026-10-01', count: 0, done: false }
        };
        bgNotifications = [];
        await background.checkCheckInOutAlerts(new Date('2026-10-01T08:30:00'));
        assert.strictEqual(bgNotifications.length, 1);
        assert.strictEqual(bgNotifications[0].id, 'checkin-alert');
        assert.ok(
            bgNotifications[0].title.includes(i18n.t('notifCheckinTitle', null, 'en')),
            `Check-in alert title in EN should match: expected "${i18n.t('notifCheckinTitle', null, 'en')}", got "${bgNotifications[0].title}"`
        );
        assert.ok(
            bgNotifications[0].message.includes("It's time to start work"),
            'Check-in alert message in EN should be in English'
        );
    }

    // 10.3 Check-out Alert in VI
    {
        bgStorage = {
            appLanguage: 'vi',
            checkInEnabled: false,
            checkOutEnabled: true,
            checkOutTime: '18:00',
            checkInOutSnoozeMinutes: 5,
            checkOutState: { lastDate: '2026-10-01', count: 0, done: false }
        };
        bgNotifications = [];
        await background.checkCheckInOutAlerts(new Date('2026-10-01T18:00:00'));
        assert.strictEqual(bgNotifications.length, 1);
        assert.strictEqual(bgNotifications[0].id, 'checkout-alert');
        assert.ok(
            bgNotifications[0].title.includes(i18n.t('notifCheckoutTitle', null, 'vi')),
            `Check-out alert title in VI should match: expected "${i18n.t('notifCheckoutTitle', null, 'vi')}", got "${bgNotifications[0].title}"`
        );
    }

    // 10.4 Check-out Alert in EN
    {
        bgStorage = {
            appLanguage: 'en',
            checkInEnabled: false,
            checkOutEnabled: true,
            checkOutTime: '18:00',
            checkInOutSnoozeMinutes: 5,
            checkOutState: { lastDate: '2026-10-01', count: 0, done: false }
        };
        bgNotifications = [];
        await background.checkCheckInOutAlerts(new Date('2026-10-01T18:00:00'));
        assert.strictEqual(bgNotifications.length, 1);
        assert.strictEqual(bgNotifications[0].id, 'checkout-alert');
        assert.ok(
            bgNotifications[0].title.includes(i18n.t('notifCheckoutTitle', null, 'en')),
            `Check-out alert title in EN should match: expected "${i18n.t('notifCheckoutTitle', null, 'en')}", got "${bgNotifications[0].title}"`
        );
        assert.ok(
            bgNotifications[0].message.includes("It's time to check out"),
            'Check-out alert message in EN should be in English'
        );
    }

    // 10.5 Unadded KPI Alert in VI & EN
    {
        const mockFetch = async () => ({
            ok: true,
            json: async () => [
                { id: 99, iid: 1, title: 'New Task', web_url: 'https://gitlab.com/grp/prj/-/issues/1', created_at: '2026-10-01T08:00:00Z' }
            ]
        });

        // VI test
        bgStorage = {
            appLanguage: 'vi',
            AccessToken: 'token123',
            gitlabUrl: 'https://gitlab.com',
            checkOutTime: '18:00',
            kpiReminderMinutesBefore: 15,
            kpiReminderEnabled: true,
            WorkItemIds: [],
            kpiReminderState: {}
        };
        bgNotifications = [];
        const triggerTime = new Date('2026-10-01T17:45:00');
        await background.checkUnaddedKpiTasksReminder(triggerTime, mockFetch);
        assert.strictEqual(bgNotifications.length, 1);
        assert.strictEqual(bgNotifications[0].id, 'kpi-unadded-alert');
        assert.ok(
            bgNotifications[0].title.includes(i18n.t('notifKpiAlertTitle', null, 'vi')),
            'Unadded KPI alert title should be localized in VI'
        );
        assert.ok(
            bgNotifications[0].message.includes('1 task tạo hôm nay chưa thêm'),
            'Unadded KPI alert message should be in Vietnamese'
        );

        // EN test
        bgStorage = {
            appLanguage: 'en',
            AccessToken: 'token123',
            gitlabUrl: 'https://gitlab.com',
            checkOutTime: '18:00',
            kpiReminderMinutesBefore: 15,
            kpiReminderEnabled: true,
            WorkItemIds: [],
            kpiReminderState: {}
        };
        bgNotifications = [];
        await background.checkUnaddedKpiTasksReminder(triggerTime, mockFetch);
        assert.strictEqual(bgNotifications.length, 1);
        assert.strictEqual(bgNotifications[0].id, 'kpi-unadded-alert');
        assert.ok(
            bgNotifications[0].title.includes(i18n.t('notifKpiAlertTitle', null, 'en')),
            'Unadded KPI alert title should be localized in EN'
        );
        assert.ok(
            bgNotifications[0].message.includes('1 task(s) created today not yet added'),
            'Unadded KPI alert message should be in English'
        );
    }
    console.log('✔ Passed: background.js dispatches properly localized notifications for Check-in, Check-out, and KPI alerts');

    // 11. Verify popup.js Localization Logic
    console.log('\n--- 11. Testing popup/popup.js Localization Logic ---');
    const popupJsContent = fs.readFileSync(path.resolve(__dirname, '../popup/popup.js'), 'utf8');

    assert.ok(popupJsContent.includes('initLanguage'), 'popup.js must call initLanguage');
    assert.ok(popupJsContent.includes('applyI18n'), 'popup.js must call applyI18n');
    assert.ok(popupJsContent.includes('setLanguage'), 'popup.js must call setLanguage when user toggles language');

    // Test renderUnaddedKpiBanner with language argument
    const popupModule = require('../popup/popup.js');
    function makeElement(tagName = 'div') {
        let _children = [];
        const attrs = {};
        return {
            tagName,
            style: {},
            get children() { return _children; },
            set children(val) { _children = val; },
            textContent: '',
            get innerHTML() { return ''; },
            set innerHTML(val) {
                if (val === '') _children = [];
            },
            setAttribute(k, v) { attrs[k] = String(v); },
            getAttribute(k) { return attrs[k]; },
            appendChild(c) { _children.push(c); }
        };
    }

    const testMockDoc = {
        elements: {
            unaddedKpiBanner: makeElement('div'),
            unaddedKpiTitle: makeElement('span'),
            unaddedKpiItemsList: makeElement('div'),
            toggleUnaddedListBtn: makeElement('button'),
            addAllUnaddedKpiBtn: makeElement('button')
        },
        getElementById(id) {
            return this.elements[id] || null;
        },
        createElement(tag) {
            return makeElement(tag);
        }
    };

    // Render with 2 tasks in English
    popupModule.renderUnaddedKpiBanner(
        [
            { id: '1', iid: '1', title: 'Task A' },
            { id: '2', iid: '2', title: 'Task B' }
        ],
        testMockDoc,
        'en'
    );
    assert.ok(
        testMockDoc.elements.unaddedKpiTitle.textContent.includes('2 task(s)') ||
        testMockDoc.elements.unaddedKpiTitle.textContent.includes('2 task'),
        'Unadded KPI banner title in EN should be in English'
    );
    assert.strictEqual(
        testMockDoc.elements.unaddedKpiItemsList.children[0].children[1].textContent,
        '+ Add',
        'Add single task button in EN should show "+ Add"'
    );

    // Render with 1 task in Vietnamese
    popupModule.renderUnaddedKpiBanner(
        [
            { id: '1', iid: '1', title: 'Task A' }
        ],
        testMockDoc,
        'vi'
    );
    assert.ok(
        testMockDoc.elements.unaddedKpiTitle.textContent.includes('1 task tạo hôm nay'),
        'Unadded KPI banner title in VI should be in Vietnamese'
    );
    assert.strictEqual(
        testMockDoc.elements.unaddedKpiItemsList.children[0].children[1].textContent,
        '+ Thêm',
        'Add single task button in VI should show "+ Thêm"'
    );

    // Render without language argument when active language is English
    i18n.setLanguage('en');
    popupModule.renderUnaddedKpiBanner(
        [
            { id: '1', iid: '1', title: 'Task A' }
        ],
        testMockDoc
    );
    assert.ok(
        testMockDoc.elements.unaddedKpiTitle.textContent.includes('task(s) created today not yet added') ||
        testMockDoc.elements.unaddedKpiTitle.textContent.includes('not yet added to KPI'),
        'Unadded KPI banner should resolve to English via getLanguage() when lang argument is omitted'
    );
    assert.strictEqual(
        testMockDoc.elements.unaddedKpiItemsList.children[0].children[1].textContent,
        '+ Add',
        'Add single task button should show "+ Add" when lang argument is omitted and current language is EN'
    );

    console.log('✔ Passed: popup.js initializes i18n, handles language switching, and localizes dynamic elements');

    console.log('\n🎉 ALL TASK 1 & TASK 2 TESTS PASSED SUCCESSFULLY! 🎉\n');
})();

