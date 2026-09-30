const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('  Kanban To-Do Enhancements - Unit & Integration Test Suite');
console.log('================================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(desc, fn) {
    totalChecks++;
    try {
        fn();
        passedChecks++;
        console.log(`  ✔ [PASS] ${desc}`);
    } catch (err) {
        console.error(`  ✖ [FAIL] ${desc}`);
        console.error(`    Error: ${err.message}`);
        throw err;
    }
}

// ---------------------------------------------------------
// 1. PURE DATA OPERATIONS (addTodoItem, updateTodoItem, changeTodoStatus, deleteTodoItem)
// ---------------------------------------------------------
console.log('▶ Section 1: Pure Data Model Functions');

let todoModule;
try {
    todoModule = require('../todo/todo.js');
} catch (err) {
    console.error('Failed to import todo/todo.js:', err.message);
}

check('Module exports pure helper functions', () => {
    assert(todoModule, 'todo/todo.js must be exportable');
    assert.strictEqual(typeof todoModule.addTodoItem, 'function', 'addTodoItem must be exported as a function');
    assert.strictEqual(typeof todoModule.updateTodoItem, 'function', 'updateTodoItem must be exported as a function');
    assert.strictEqual(typeof todoModule.changeTodoStatus, 'function', 'changeTodoStatus must be exported as a function');
    assert.strictEqual(typeof todoModule.deleteTodoItem, 'function', 'deleteTodoItem must be exported as a function');
    assert.strictEqual(typeof todoModule.resolveTargetStatusFromColumn, 'function', 'resolveTargetStatusFromColumn must be exported as a function');
});

const { addTodoItem, updateTodoItem, changeTodoStatus, deleteTodoItem, resolveTargetStatusFromColumn } = todoModule || {};

check('addTodoItem: creates task with status todo, id, title, and deadline', () => {
    const initial = [];
    const updated = addTodoItem(initial, 'Implement Task 1', '2026-10-02T18:00');
    assert.strictEqual(updated.length, 1, 'Length should be 1');
    assert.strictEqual(initial.length, 0, 'addTodoItem must be immutable (initial array unmodified)');
    
    const item = updated[0];
    assert.ok(item.id, 'Task must have an id');
    assert.strictEqual(typeof item.id, 'string', 'Task id must be a string');
    assert.strictEqual(item.title, 'Implement Task 1', 'Task title must match');
    assert.strictEqual(item.deadline, '2026-10-02T18:00', 'Task deadline must match');
    assert.strictEqual(item.status, 'todo', 'Default status must be todo');
});

check('addTodoItem: handles empty or invalid title by returning unchanged array', () => {
    const initial = [{ id: '1', title: 'Existing', deadline: '', status: 'todo' }];
    const res1 = addTodoItem(initial, '', '2026-10-02T18:00');
    assert.strictEqual(res1.length, 1, 'Empty title should not add a task');
    assert.strictEqual(res1[0].id, '1');

    const res2 = addTodoItem(initial, '   ', '');
    assert.strictEqual(res2.length, 1, 'Whitespace title should not add a task');

    const res3 = addTodoItem(null, 'Task with null list', '');
    assert.strictEqual(res3.length, 1, 'Should handle null initial todos safely');
});

check('updateTodoItem: modifies title and deadline cleanly', () => {
    const initial = [
        { id: 'task-100', title: 'Old Title', deadline: '2026-10-01T12:00', status: 'processing' },
        { id: 'task-200', title: 'Keep Title', deadline: '', status: 'todo' }
    ];

    const updated = updateTodoItem(initial, 'task-100', 'New Clean Title', '2026-10-05T09:30');
    assert.strictEqual(updated.length, 2, 'Array length must remain 2');
    assert.strictEqual(initial[0].title, 'Old Title', 'Original array must not be mutated');

    const edited = updated.find(t => t.id === 'task-100');
    assert.strictEqual(edited.title, 'New Clean Title', 'Title should be updated');
    assert.strictEqual(edited.deadline, '2026-10-05T09:30', 'Deadline should be updated');
    assert.strictEqual(edited.status, 'processing', 'Status should be preserved when editing title/deadline');

    // Unmodified item check
    const unmodified = updated.find(t => t.id === 'task-200');
    assert.strictEqual(unmodified.title, 'Keep Title');
});

check('updateTodoItem: handles non-existent ID gracefully', () => {
    const initial = [{ id: '1', title: 'Item', deadline: '', status: 'todo' }];
    const updated = updateTodoItem(initial, 'non-existent', 'Changed', '2026-10-10');
    assert.deepStrictEqual(updated, initial, 'Array should remain identical if ID not found');
});

check('changeTodoStatus: transitions status between todo, processing, and done', () => {
    const initial = [{ id: 'task-1', title: 'Sample', deadline: '', status: 'todo' }];
    
    // Transition to processing
    const toProcessing = changeTodoStatus(initial, 'task-1', 'processing');
    assert.strictEqual(toProcessing[0].status, 'processing', 'Status should become processing');
    assert.strictEqual(initial[0].status, 'todo', 'Original array must not be mutated');

    // Transition to done
    const toDone = changeTodoStatus(toProcessing, 'task-1', 'done');
    assert.strictEqual(toDone[0].status, 'done', 'Status should become done');

    // Transition back to todo
    const toTodo = changeTodoStatus(toDone, 'task-1', 'todo');
    assert.strictEqual(toTodo[0].status, 'todo', 'Status should become todo');
});

check('changeTodoStatus: rejects invalid status values without corrupting state', () => {
    const initial = [{ id: 'task-1', title: 'Sample', deadline: '', status: 'todo' }];
    const res = changeTodoStatus(initial, 'task-1', 'unknown-status');
    assert.strictEqual(res[0].status, 'todo', 'Status should remain unchanged on invalid status');
});

check('deleteTodoItem: removes task by id immutably', () => {
    const initial = [
        { id: '1', title: 'T1', status: 'todo' },
        { id: '2', title: 'T2', status: 'processing' },
        { id: '3', title: 'T3', status: 'done' }
    ];

    const updated = deleteTodoItem(initial, '2');
    assert.strictEqual(updated.length, 2, 'Length should be 2');
    assert.strictEqual(initial.length, 3, 'Original array should not be mutated');
    assert.strictEqual(updated.some(t => t.id === '2'), false, 'Deleted id should not exist');
    assert.strictEqual(updated[0].id, '1');
    assert.strictEqual(updated[1].id, '3');
});

check('resolveTargetStatusFromColumn: resolves column IDs to target status strings', () => {
    assert.strictEqual(resolveTargetStatusFromColumn('col-todo'), 'todo');
    assert.strictEqual(resolveTargetStatusFromColumn('col-processing'), 'processing');
    assert.strictEqual(resolveTargetStatusFromColumn('col-done'), 'done');
    assert.strictEqual(resolveTargetStatusFromColumn('list-todo'), 'todo');
    assert.strictEqual(resolveTargetStatusFromColumn('list-processing'), 'processing');
    assert.strictEqual(resolveTargetStatusFromColumn('list-done'), 'done');
    assert.strictEqual(resolveTargetStatusFromColumn('todo'), 'todo');
    assert.strictEqual(resolveTargetStatusFromColumn('processing'), 'processing');
    assert.strictEqual(resolveTargetStatusFromColumn('done'), 'done');
});

check('resolveTargetStatusFromColumn: resolves mock DOM elements and nested elements with .closest()', () => {
    const todoEl = { id: 'col-todo' };
    const processingEl = { id: 'list-processing' };
    const doneEl = { id: 'col-done' };
    assert.strictEqual(resolveTargetStatusFromColumn(todoEl), 'todo');
    assert.strictEqual(resolveTargetStatusFromColumn(processingEl), 'processing');
    assert.strictEqual(resolveTargetStatusFromColumn(doneEl), 'done');

    const nestedInProcessing = {
        closest: (sel) => ({ id: 'col-processing' })
    };
    assert.strictEqual(resolveTargetStatusFromColumn(nestedInProcessing), 'processing');

    const nestedInDone = {
        closest: (sel) => ({ id: 'list-done' })
    };
    assert.strictEqual(resolveTargetStatusFromColumn(nestedInDone), 'done');
});

check('resolveTargetStatusFromColumn: returns null for invalid or null inputs', () => {
    assert.strictEqual(resolveTargetStatusFromColumn(null), null);
    assert.strictEqual(resolveTargetStatusFromColumn(undefined), null);
    assert.strictEqual(resolveTargetStatusFromColumn(''), null);
    assert.strictEqual(resolveTargetStatusFromColumn({ id: 'unknown-col' }), null);
});

// ---------------------------------------------------------
// 2. DOM STRUCTURE & MANIFEST V3 CSP COMPLIANCE IN todo/todo.html
// ---------------------------------------------------------
console.log('\n▶ Section 2: DOM Structure & Manifest V3 CSP Compliance');

const todoHtmlPath = path.resolve(ROOT_DIR, 'todo/todo.html');
assert(fs.existsSync(todoHtmlPath), 'todo/todo.html must exist');
const todoHtml = fs.readFileSync(todoHtmlPath, 'utf8');

check('CSP: No external Google Fonts in todo/todo.html', () => {
    assert(!todoHtml.includes('fonts.googleapis.com'), 'Must not link to fonts.googleapis.com');
    assert(!todoHtml.includes('fonts.gstatic.com'), 'Must not link to fonts.gstatic.com');
});

check('DOM: Contains Task Edit Modal (#editModal)', () => {
    assert(todoHtml.includes('id="editModal"'), 'Must contain modal container #editModal');
    assert(todoHtml.includes('id="edit-task-title"'), 'Must contain title input #edit-task-title');
    assert(todoHtml.includes('id="edit-task-deadline"'), 'Must contain deadline input #edit-task-deadline');
    assert(todoHtml.includes('id="save-edit-btn"'), 'Must contain save button #save-edit-btn');
    assert(todoHtml.includes('id="close-edit-btn"'), 'Must contain close button #close-edit-btn');
    assert(todoHtml.includes('id="cancel-edit-btn"'), 'Must contain cancel button #cancel-edit-btn');
});

check('DOM: Contains Collapsible Reminder Settings Toggle & Panel', () => {
    assert(todoHtml.includes('id="toggleReminderBtn"'), 'Must contain reminder settings toggle button #toggleReminderBtn');
    assert(todoHtml.includes('id="reminder-settings-panel"'), 'Must contain collapsible reminder container #reminder-settings-panel');
});

// ---------------------------------------------------------
// 3. STYLESHEET ENHANCEMENTS IN todo/todo.css
// ---------------------------------------------------------
console.log('\n▶ Section 3: Stylesheet Enhancements in todo/todo.css');

const todoCssPath = path.resolve(ROOT_DIR, 'todo/todo.css');
assert(fs.existsSync(todoCssPath), 'todo/todo.css must exist');
const todoCss = fs.readFileSync(todoCssPath, 'utf8');

check('CSS: Uses modern system font stack fallback', () => {
    assert(todoCss.includes("'Segoe UI'"), 'Should include Segoe UI in font stack');
    assert(todoCss.includes('system-ui'), 'Should include system-ui in font stack');
});

check('CSS: Styles modal dialog and elements', () => {
    assert(todoCss.includes('.modal'), 'Must include .modal styling');
    assert(todoCss.includes('.modal-content'), 'Must include .modal-content styling');
    assert(todoCss.includes('.modal-header'), 'Must include .modal-header styling');
    assert(todoCss.includes('.modal-body'), 'Must include .modal-body styling');
    assert(todoCss.includes('.modal-footer'), 'Must include .modal-footer styling');
});

check('CSS: Styles edit task button (.btn-edit-task)', () => {
    assert(todoCss.includes('.btn-edit-task'), 'Must include .btn-edit-task styling');
});

check('CSS: Styles drag and drop feedback (.is-dragging, .drag-over)', () => {
    assert(todoCss.includes('.is-dragging'), 'Must include .is-dragging styling');
    assert(todoCss.includes('opacity: 0.4'), 'Must set opacity: 0.4 on .is-dragging');
    assert(todoCss.includes('.drag-over'), 'Must include .drag-over styling');
});

// ---------------------------------------------------------
// 4. HTML5 DRAG & DROP IMPLEMENTATION IN todo/todo.js
// ---------------------------------------------------------
console.log('\n▶ Section 4: HTML5 Drag & Drop Implementation in todo/todo.js');

const todoJsPath = path.resolve(ROOT_DIR, 'todo/todo.js');
assert(fs.existsSync(todoJsPath), 'todo/todo.js must exist');
const todoJs = fs.readFileSync(todoJsPath, 'utf8');

check('JS: Task cards are configured with draggable="true"', () => {
    assert(
        todoJs.includes("card.draggable = true") ||
        todoJs.includes("card.setAttribute('draggable', 'true')") ||
        todoJs.includes('card.setAttribute("draggable", "true")'),
        'Must set draggable on task cards'
    );
});

check('JS: Implements dragstart, dragend, dragover, dragleave, and drop event handlers', () => {
    assert(todoJs.includes('dragstart'), 'Must handle dragstart event');
    assert(todoJs.includes('dataTransfer.setData'), 'Must set dataTransfer in dragstart');
    assert(todoJs.includes('dragend'), 'Must handle dragend event');
    assert(todoJs.includes('dragover'), 'Must handle dragover event');
    assert(todoJs.includes('dragleave'), 'Must handle dragleave event');
    assert(todoJs.includes('drop'), 'Must handle drop event');
});

// ---------------------------------------------------------
// 5. DUAL-MODE LAUNCHING & NOTIFICATION CLICK ROUTING (TASK 3)
// ---------------------------------------------------------
console.log('\n▶ Section 5: Dual-Mode Launching & Notification Click Routing');

check('JS (todo.js): Exports detectWindowMode function', () => {
    assert(typeof todoModule.detectWindowMode === 'function', 'detectWindowMode must be exported by todo/todo.js');
});

check('JS (todo.js): detectWindowMode identifies popup as window and others as tab', () => {
    const { detectWindowMode } = todoModule;
    assert.strictEqual(detectWindowMode({ type: 'popup' }), 'window', 'Popup window should be detected as window');
    assert.strictEqual(detectWindowMode({ type: 'normal' }), 'tab', 'Normal window should be detected as tab');
    assert.strictEqual(detectWindowMode({}), 'tab', 'Empty object should be detected as tab');
    assert.strictEqual(detectWindowMode(null), 'tab', 'null should be detected as tab');
    assert.strictEqual(detectWindowMode(undefined), 'tab', 'undefined should be detected as tab');
});

check('JS (todo.js): switchMode creates popup window or tab and closes window inside callback', () => {
    assert.strictEqual(typeof todoModule.switchMode, 'function', 'switchMode must be exported');

    // Case 1: currentMode is 'tab' -> open popup window
    let windowOpts = null;
    let windowCallback = null;
    let windowClosed = false;

    const mockChromeTab = {
        runtime: { getURL: (p) => `chrome-extension://mock/${p}` },
        windows: {
            create: (opts, cb) => {
                windowOpts = opts;
                windowCallback = cb;
            }
        }
    };
    const mockWinTab = {
        close: () => { windowClosed = true; }
    };

    todoModule.switchMode('tab', mockChromeTab, mockWinTab);
    assert.ok(windowOpts, 'chrome.windows.create should be called');
    assert.strictEqual(windowOpts.url, 'chrome-extension://mock/todo/todo.html');
    assert.strictEqual(windowOpts.type, 'popup');
    assert.strictEqual(windowClosed, false, 'window.close must NOT be called before callback');

    // Trigger callback
    windowCallback();
    assert.strictEqual(windowClosed, true, 'window.close must be called inside callback');

    // Case 2: currentMode is 'window' -> open browser tab
    let tabOpts = null;
    let tabCallback = null;
    let tabWindowClosed = false;

    const mockChromeWin = {
        runtime: { getURL: (p) => `chrome-extension://mock/${p}` },
        tabs: {
            create: (opts, cb) => {
                tabOpts = opts;
                tabCallback = cb;
            }
        }
    };
    const mockWinWin = {
        close: () => { tabWindowClosed = true; }
    };

    todoModule.switchMode('window', mockChromeWin, mockWinWin);
    assert.ok(tabOpts, 'chrome.tabs.create should be called');
    assert.strictEqual(tabOpts.url, 'chrome-extension://mock/todo/todo.html');
    assert.strictEqual(tabWindowClosed, false, 'window.close must NOT be called before callback');

    // Trigger callback
    tabCallback();
    assert.strictEqual(tabWindowClosed, true, 'window.close must be called inside callback');
});

check('DOM (todo.html): Contains #modeSwitchBtn in .header-right', () => {
    assert(todoHtml.includes('id="modeSwitchBtn"'), 'todo.html must contain #modeSwitchBtn');
    const headerRightMatch = todoHtml.match(/<div class="header-right">([\s\S]*?)<\/div>/);
    assert(headerRightMatch, 'todo.html must contain .header-right');
    assert(headerRightMatch[1].includes('id="modeSwitchBtn"'), '#modeSwitchBtn must be inside .header-right');
});

const popupHtmlPath = path.resolve(ROOT_DIR, 'popup/popup.html');
assert(fs.existsSync(popupHtmlPath), 'popup/popup.html must exist');
const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');

const popupCssPath = path.resolve(ROOT_DIR, 'popup/popup.css');
assert(fs.existsSync(popupCssPath), 'popup/popup.css must exist');
const popupCss = fs.readFileSync(popupCssPath, 'utf8');

check('DOM (popup.html): Contains dual-mode To-Do buttons and structured grid', () => {
    assert(popupHtml.includes('id="todo-btn"'), 'popup.html must contain #todo-btn');
    assert(popupHtml.includes('id="todo-tab-btn"'), 'popup.html must contain #todo-tab-btn');
    
    // Verify button ordering in tools-grid:
    const gridMatch = popupHtml.match(/<div class="tools-grid">([\s\S]*?)<\/div>/);
    assert(gridMatch, 'popup.html must contain .tools-grid');
    const gridContent = gridMatch[1];
    const idxNote = gridContent.indexOf('id="note-btn"');
    const idxNoteTab = gridContent.indexOf('id="note-tab-btn"');
    const idxTodo = gridContent.indexOf('id="todo-btn"');
    const idxTodoTab = gridContent.indexOf('id="todo-tab-btn"');
    const idxExport = gridContent.indexOf('id="exportTask-btn"');
    const idxImport = gridContent.indexOf('id="importTask-btn"');

    assert(idxNote !== -1 && idxNoteTab !== -1, 'Note buttons must exist');
    assert(idxTodo !== -1 && idxTodoTab !== -1, 'To-Do buttons must exist');
    assert(idxExport !== -1 && idxImport !== -1, 'Export/Import buttons must exist');

    assert(idxNote < idxNoteTab, 'Row 1: note-btn before note-tab-btn');
    assert(idxNoteTab < idxTodo, 'Row 2 follows Row 1');
    assert(idxTodo < idxTodoTab, 'Row 2: todo-btn before todo-tab-btn');
    assert(idxTodoTab < idxExport, 'Row 3 follows Row 2');
    assert(idxExport < idxImport, 'Row 3: exportTask-btn before importTask-btn');
});

check('CSS (popup.css): Balanced 2-column grid without todo span 2', () => {
    assert(!popupCss.includes('#todo-btn {\n    grid-column: span 2;\n}') &&
           !popupCss.includes('#todo-btn { grid-column: span 2; }') &&
           !popupCss.includes('grid-column: span 2'),
           'popup.css must not have grid-column: span 2 for todo-btn'
    );
});

let popupModule;
try {
    popupModule = require('../popup/popup.js');
} catch (err) {
    console.error('Failed to import popup/popup.js:', err.message);
}

check('JS (popup.js): Exports openTodoWindow and openTodoTab helpers', () => {
    assert(popupModule, 'popup/popup.js must be exportable');
    assert.strictEqual(typeof popupModule.openTodoWindow, 'function', 'openTodoWindow must be exported');
    assert.strictEqual(typeof popupModule.openTodoTab, 'function', 'openTodoTab must be exported');
});

check('JS (popup.js): openTodoWindow and openTodoTab invoke chrome APIs correctly', () => {
    const originalChrome = global.chrome;
    let windowCreated = null;
    let tabCreated = null;

    global.chrome = {
        runtime: {
            getURL: (rel) => `chrome-extension://mock-id/${rel}`
        },
        windows: {
            create: (opts) => { windowCreated = opts; }
        },
        tabs: {
            create: (opts) => { tabCreated = opts; }
        }
    };

    try {
        popupModule.openTodoWindow();
        assert.ok(windowCreated, 'openTodoWindow must call chrome.windows.create');
        assert.strictEqual(windowCreated.url, 'chrome-extension://mock-id/todo/todo.html');
        assert.strictEqual(windowCreated.type, 'popup');
        assert.strictEqual(windowCreated.width, 540);
        assert.strictEqual(windowCreated.height, 680);

        popupModule.openTodoTab();
        assert.ok(tabCreated, 'openTodoTab must call chrome.tabs.create');
        assert.strictEqual(tabCreated.url, 'chrome-extension://mock-id/todo/todo.html');
    } finally {
        global.chrome = originalChrome;
    }
});

let backgroundModule;
try {
    backgroundModule = require('../background.js');
} catch (err) {
    console.error('Failed to import background.js:', err.message);
}

check('JS (background.js): Routes to-do reminder notification clicks to todo/todo.html', async () => {
    assert(backgroundModule, 'background.js must be exportable');
    assert(typeof backgroundModule.handleNotificationClick === 'function', 'handleNotificationClick must be exported by background.js');

    const originalChrome = global.chrome;
    let clearedNotif = null;
    let openedTab = null;

    global.chrome = {
        runtime: {
            getURL: (rel) => `chrome-extension://mock-id/${rel}`
        },
        notifications: {
            clear: (id) => { clearedNotif = id; }
        },
        tabs: {
            create: (opts) => { openedTab = opts; }
        },
        storage: {
            local: {
                get: async () => ({}),
                set: async () => {}
            }
        }
    };

    try {
        await backgroundModule.handleNotificationClick('todo-task-999');
        assert.strictEqual(clearedNotif, 'todo-task-999', 'Notification must be cleared on click');
        assert.ok(openedTab, 'A tab must be opened on to-do notification click');
        assert.strictEqual(openedTab.url, 'chrome-extension://mock-id/todo/todo.html', 'Must open todo/todo.html');
    } finally {
        global.chrome = originalChrome;
    }
});

// ---------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------
console.log('\n================================================================');
console.log(`  Tests finished: ${passedChecks}/${totalChecks} passed`);
console.log('================================================================\n');

if (passedChecks === totalChecks) {
    console.log('✔ All Kanban To-Do Enhancement unit tests passed successfully!\n');
    process.exit(0);
} else {
    console.error(`✖ ${totalChecks - passedChecks} tests failed.\n`);
    process.exit(1);
}

