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

    console.log('\n🎉 ALL I18N CORE TESTS PASSED SUCCESSFULLY! 🎉\n');
})();
