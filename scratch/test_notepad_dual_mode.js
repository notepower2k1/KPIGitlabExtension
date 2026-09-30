const assert = require('assert');
const path = require('path');

// Mock Chrome APIs for Node test environment
global.chrome = {
    runtime: {
        getURL: (p) => `chrome-extension://mock-id/${p}`
    },
    storage: {
        local: {
            get: async () => ({}),
            set: async () => ({})
        }
    },
    windows: {
        create: () => {},
        getCurrent: (cb) => cb({ type: 'popup' })
    },
    tabs: {
        create: () => {}
    }
};

const notepad = require('../note/note.js');

console.log('--- Testing Notepad Data Model & Operations ---');

// 1. Initial State
console.log('Testing createInitialState()...');
const state = notepad.createInitialState();
assert.ok(state, 'Initial state should not be null or undefined');
assert.strictEqual(Array.isArray(state.tabs), true, 'tabs should be an array');
assert.strictEqual(state.tabs.length, 1, 'Initial state should have exactly 1 tab');
assert.strictEqual(state.activeTabId, state.tabs[0].id, 'activeTabId should match first tab id');
assert.strictEqual(state.tabs[0].title, 'Ghi chú 1', 'First tab title should be "Ghi chú 1"');
assert.strictEqual(state.tabs[0].content, '', 'First tab content should be empty string');
assert.ok(typeof state.tabs[0].updatedAt === 'number', 'updatedAt should be a numeric timestamp');

// 2. Add Tab
console.log('Testing addTab()...');
const stateWith2 = notepad.addTab(state, 'Công việc', 'Nội dung test');
assert.strictEqual(stateWith2.tabs.length, 2, 'Tab count should be 2 after adding');
assert.strictEqual(stateWith2.activeTabId, stateWith2.tabs[1].id, 'activeTabId should switch to newly added tab');
assert.strictEqual(stateWith2.tabs[1].title, 'Công việc', 'New tab title should match');
assert.strictEqual(stateWith2.tabs[1].content, 'Nội dung test', 'New tab content should match');
assert.strictEqual(state.tabs.length, 1, 'addTab should be immutable (original state unmodified)');

// Add Tab with default title fallback
const stateWith3 = notepad.addTab(stateWith2, '', 'Nội dung không tiêu đề');
assert.strictEqual(stateWith3.tabs.length, 3);
assert.strictEqual(stateWith3.tabs[2].title, 'Ghi chú 3', 'Default title fallback should be "Ghi chú 3"');

// 3. Rename Tab
console.log('Testing renameTab()...');
const renamedState = notepad.renameTab(stateWith2, stateWith2.tabs[0].id, 'Checklist');
assert.strictEqual(renamedState.tabs[0].title, 'Checklist', 'Tab should be renamed to Checklist');
assert.strictEqual(stateWith2.tabs[0].title, 'Ghi chú 1', 'renameTab should be immutable');

// Rename Tab with empty title fallback
const renamedEmpty = notepad.renameTab(renamedState, renamedState.tabs[0].id, '   ');
assert.strictEqual(renamedEmpty.tabs[0].title, 'Ghi chú', 'Renaming with whitespace should fallback to "Ghi chú"');

// 4. Update Content
console.log('Testing updateTabContent()...');
const updatedState = notepad.updateTabContent(renamedState, renamedState.tabs[0].id, 'Hàng 1\nHàng 2');
assert.strictEqual(updatedState.tabs[0].content, 'Hàng 1\nHàng 2', 'Tab content should be updated');
assert.strictEqual(renamedState.tabs[0].content, '', 'updateTabContent should be immutable');

// 5. Select Tab
console.log('Testing selectTab()...');
const selectedState = notepad.selectTab(stateWith2, stateWith2.tabs[0].id);
assert.strictEqual(selectedState.activeTabId, stateWith2.tabs[0].id, 'activeTabId should update to selected tab');

const invalidSelect = notepad.selectTab(selectedState, 'non-existent-id');
assert.strictEqual(invalidSelect.activeTabId, stateWith2.tabs[0].id, 'Invalid tab ID should preserve current selection');

// 6. Word and Char Count
console.log('Testing calculateWordAndCharCount()...');
const counts = notepad.calculateWordAndCharCount('Xin chào Việt Nam 123');
assert.strictEqual(counts.words, 5, 'Word count should be 5');
assert.strictEqual(counts.chars, 21, 'Char count should be 21');

const emptyCounts = notepad.calculateWordAndCharCount('');
assert.strictEqual(emptyCounts.words, 0);
assert.strictEqual(emptyCounts.chars, 0);

const nullCounts = notepad.calculateWordAndCharCount(null);
assert.strictEqual(nullCounts.words, 0);
assert.strictEqual(nullCounts.chars, 0);

const multilineCounts = notepad.calculateWordAndCharCount('Dòng một\n\nDòng hai   cuối');
assert.strictEqual(multilineCounts.words, 5);

// 7. Delete Tab
console.log('Testing removeTab()...');
const deletedState = notepad.removeTab(updatedState, stateWith2.tabs[1].id);
assert.strictEqual(deletedState.tabs.length, 1, 'Should have 1 tab after deletion');
assert.strictEqual(deletedState.activeTabId, deletedState.tabs[0].id, 'activeTabId should point to remaining tab');
assert.strictEqual(updatedState.tabs.length, 2, 'removeTab should be immutable');

// Delete active tab when multiple tabs exist
const multiTabState = notepad.addTab(notepad.addTab(notepad.createInitialState(), 'Tab 2'), 'Tab 3');
assert.strictEqual(multiTabState.tabs.length, 3);
const activeIdToDelete = multiTabState.tabs[1].id;
const activeSelected = notepad.selectTab(multiTabState, activeIdToDelete);
const afterActiveDeleted = notepad.removeTab(activeSelected, activeIdToDelete);
assert.strictEqual(afterActiveDeleted.tabs.length, 2);
assert.notStrictEqual(afterActiveDeleted.activeTabId, activeIdToDelete, 'Active tab should switch when deleted tab was active');

// Delete the only remaining tab -> creates fresh fallback initial tab
const singleTabState = notepad.createInitialState();
const emptyTabResult = notepad.removeTab(singleTabState, singleTabState.tabs[0].id);
assert.strictEqual(emptyTabResult.tabs.length, 1, 'Should always retain at least 1 tab');
assert.strictEqual(emptyTabResult.activeTabId, emptyTabResult.tabs[0].id);

// 8. Migration from Legacy Notes
console.log('Testing migrateLegacyNotes()...');
const legacyNotes = [
    { id: 101, text: 'Ghi chú số 1 từ trước\nNội dung chi tiết', timestamp: '2026-09-01T08:00:00.000Z' },
    { id: 102, text: 'Ghi chú số 2', timestamp: '2026-09-02T08:00:00.000Z' }
];
const migratedState = notepad.migrateLegacyNotes(legacyNotes);
assert.strictEqual(migratedState.tabs.length, 2, 'Should migrate 2 legacy notes into 2 tabs');
assert.strictEqual(migratedState.tabs[0].content, 'Ghi chú số 1 từ trước\nNội dung chi tiết');
assert.strictEqual(migratedState.tabs[1].content, 'Ghi chú số 2');
assert.strictEqual(migratedState.tabs[0].title, 'Ghi chú số 1 từ trướ', 'Title should be first line sliced to 20 chars');
assert.strictEqual(migratedState.tabs[1].title, 'Ghi chú số 2');
assert.strictEqual(migratedState.activeTabId, migratedState.tabs[0].id, 'activeTabId should be first tab');

// Migration with empty / null legacy data
const emptyMigration = notepad.migrateLegacyNotes([]);
assert.strictEqual(emptyMigration.tabs.length, 1);
assert.strictEqual(emptyMigration.tabs[0].title, 'Ghi chú 1');

const nullMigration = notepad.migrateLegacyNotes(null);
assert.strictEqual(nullMigration.tabs.length, 1);

console.log('✔ All Task 1 unit tests passed!');

console.log('\n--- Testing Notepad UI Structure & CSS Styling (Task 2) ---');

const fs = require('fs');

// 9. Verify note/note.html DOM structure
const noteHtmlPath = path.join(__dirname, '../note/note.html');
assert.ok(fs.existsSync(noteHtmlPath), 'note/note.html should exist');
const noteHtml = fs.readFileSync(noteHtmlPath, 'utf8');

const requiredElementIds = [
    'tabStrip',
    'addTabBtn',
    'modeSwitchBtn',
    'privacyBtn',
    'copyAllBtn',
    'themeToggleBtn',
    'noteTextarea',
    'statusBar',
    'saveStatus',
    'wordCount',
    'charCount'
];

requiredElementIds.forEach(id => {
    const idRegex = new RegExp(`id=["']${id}["']`);
    assert.ok(idRegex.test(noteHtml), `note/note.html must contain element with id="${id}"`);
});
console.log('✔ All required DOM IDs exist in note/note.html');

// Check textarea attributes
assert.ok(/<textarea[^>]*id=["']noteTextarea["'][^>]*>/i.test(noteHtml) || /<textarea[^>]*id=["']noteTextarea["']/i.test(noteHtml), 'noteTextarea must be a textarea element');
assert.ok(/spellcheck=["']false["']/i.test(noteHtml), 'noteTextarea should have spellcheck="false"');
assert.ok(/placeholder=/i.test(noteHtml), 'noteTextarea should have a placeholder attribute');

// 10. Verify note/note.css styling and classes
const noteCssPath = path.join(__dirname, '../note/note.css');
assert.ok(fs.existsSync(noteCssPath), 'note/note.css should exist');
const noteCss = fs.readFileSync(noteCssPath, 'utf8');

const requiredCssSelectors = [
    '.tab-strip',
    '.tab-item',
    '.tab-item.active',
    '.privacy-blur'
];

requiredCssSelectors.forEach(sel => {
    assert.ok(noteCss.includes(sel), `note/note.css must contain CSS selector "${sel}"`);
});

// Check theme support (data-theme="dark" and/or .dark-theme)
assert.ok(
    noteCss.includes('[data-theme="dark"]') || noteCss.includes('.dark-theme'),
    'note/note.css must support dark theme via [data-theme="dark"] or .dark-theme'
);

// Check privacy blur filter
assert.ok(
    /\.privacy-blur[\s\S]*?filter:\s*blur\(/i.test(noteCss),
    'note/note.css must have filter: blur(...) defined on .privacy-blur'
);

// Check monospace/crisp font family for editor
assert.ok(
    /monospace/i.test(noteCss),
    'note/note.css must include monospace in typography for editor'
);

console.log('✔ All required CSS selectors, themes, and styles exist in note/note.css');
console.log('✔ All Task 2 UI & Styling tests passed!');

console.log('\n--- Testing Editor Interactions, Auto-Save & Dual-Mode (Task 3) ---');

// 11. Mode Detection Helper
console.log('Testing detectWindowMode()...');
assert.strictEqual(notepad.detectWindowMode({ type: 'popup' }), 'window', 'Popup window should be detected as window mode');
assert.strictEqual(notepad.detectWindowMode({ type: 'normal' }), 'tab', 'Normal window should be detected as tab mode');
assert.strictEqual(notepad.detectWindowMode(null), 'tab', 'Null window should default to tab mode');
assert.strictEqual(notepad.detectWindowMode({}), 'tab', 'Undefined type should default to tab mode');

// 12. Tab Key Indentation Helper
console.log('Testing handleTabKeyIndentation()...');
const mockTextarea = {
    value: 'Hello',
    selectionStart: 5,
    selectionEnd: 5
};
const indentResult = notepad.handleTabKeyIndentation(mockTextarea);
assert.strictEqual(mockTextarea.value, 'Hello  ', 'Should insert 2 spaces at caret position');
assert.strictEqual(mockTextarea.selectionStart, 7, 'Caret should advance by 2 spaces');
assert.strictEqual(mockTextarea.selectionEnd, 7, 'Selection end should match caret');

// With selection replacement
const mockTextareaWithSelection = {
    value: 'Start [REPLACE_ME] End',
    selectionStart: 6,
    selectionEnd: 18
};
notepad.handleTabKeyIndentation(mockTextareaWithSelection);
assert.strictEqual(mockTextareaWithSelection.value, 'Start    End', 'Selected text should be replaced with 2 spaces');
assert.strictEqual(mockTextareaWithSelection.selectionStart, 8);

// 13. Debounced Auto-Save Logic
console.log('Testing createDebouncedSaver()...');
let saveCallCount = 0;
let lastSavedState = null;
const debouncedSaver = notepad.createDebouncedSaver((data) => {
    saveCallCount++;
    lastSavedState = data;
}, 50);

assert.strictEqual(debouncedSaver.isPending(), false);
debouncedSaver.trigger({ text: 'Draft 1' });
debouncedSaver.trigger({ text: 'Draft 2' });
debouncedSaver.trigger({ text: 'Draft 3' });
assert.strictEqual(debouncedSaver.isPending(), true);
assert.strictEqual(saveCallCount, 0, 'Should not save immediately when debounced');

// Test flush()
debouncedSaver.flush();
assert.strictEqual(saveCallCount, 1, 'Flush should execute save immediately');
assert.deepStrictEqual(lastSavedState, { text: 'Draft 3' });
assert.strictEqual(debouncedSaver.isPending(), false);

// Test async flush() returning promise
let asyncSaved = false;
const asyncSaver = notepad.createDebouncedSaver(async (data) => {
    asyncSaved = true;
    return 'saved-ok';
}, 50);

asyncSaver.trigger({ text: 'Async data' });
const flushPromise = asyncSaver.flush();
assert.ok(flushPromise && typeof flushPromise.then === 'function', 'flush() should return a Promise');
flushPromise.then(res => {
    assert.strictEqual(asyncSaved, true, 'Async flush should execute saveFn');
    assert.strictEqual(res, 'saved-ok', 'flush() should resolve with saveFn result');
});

// Test flush() when idle returns resolved promise
const idlePromise = asyncSaver.flush();
assert.ok(idlePromise && typeof idlePromise.then === 'function', 'flush() when idle should return a Promise');

// 14. Theme Application Helper
console.log('Testing applyTheme()...');
const mockDocument = {
    documentElement: {
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        removeAttribute(k) { delete this.attributes[k]; },
        getAttribute(k) { return this.attributes[k]; }
    },
    body: {
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); }
        }
    }
};

notepad.applyTheme('dark', mockDocument);
assert.strictEqual(mockDocument.documentElement.getAttribute('data-theme'), 'dark');
assert.strictEqual(mockDocument.body.classList.contains('dark-theme'), true);

notepad.applyTheme('light', mockDocument);
assert.strictEqual(mockDocument.documentElement.getAttribute('data-theme'), 'light');
assert.strictEqual(mockDocument.body.classList.contains('dark-theme'), false);

// 15. Privacy Mask Helper
console.log('Testing togglePrivacyMask()...');
const mockEditorElement = {
    classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); },
        toggle(c, force) {
            if (force !== undefined) {
                if (force) this.add(c); else this.remove(c);
                return force;
            }
            if (this.contains(c)) { this.remove(c); return false; }
            this.add(c); return true;
        }
    }
};

const maskActive = notepad.togglePrivacyMask(mockEditorElement, true);
assert.strictEqual(maskActive, true);
assert.strictEqual(mockEditorElement.classList.contains('privacy-blur'), true);

const maskInactive = notepad.togglePrivacyMask(mockEditorElement, false);
assert.strictEqual(maskInactive, false);
assert.strictEqual(mockEditorElement.classList.contains('privacy-blur'), false);

console.log('✔ All Task 3 editor interactions, auto-save & dual-mode tests passed!');

