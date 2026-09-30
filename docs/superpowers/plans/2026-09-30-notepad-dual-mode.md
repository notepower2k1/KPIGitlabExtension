# Notepad Multi-Tab Dual-Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows 11 style multi-tab notepad with dual-mode support (pop-out mini window vs browser tab), auto-save per keystroke, privacy blur mask, and seamless legacy notes migration.

**Architecture:** Multi-tab notepad SPA in `note/` backed by `chrome.storage.local` key `NotepadTabs` with debounced auto-save. Dual-mode opening via `chrome.windows.create({ type: 'popup' })` and `chrome.tabs.create`, with 1-click in-app mode switching. Popup extension integration in `#tools-tab`.

**Tech Stack:** Vanilla JavaScript (ES2022), HTML5, CSS3 with CSS Variables (Light/Dark themes), Chrome Extension Manifest V3 (`chrome.windows`, `chrome.tabs`, `chrome.storage.local`).

**Spec:** `docs/superpowers/specs/2026-09-30-notepad-dual-mode-design.md`

## Global Constraints
- Manifest V3 compliant: No external CDNs, inline eval, or remote scripts.
- Zero data loss: Migrate existing `Notes` records into `NotepadTabs` automatically.
- Auto-save debounced at 300ms to preserve performance and prevent storage quota exhaustion.
- All existing extension functions (KPI dashboard, GitLab quick links, check-in alerts, to-do reminders) must experience zero regressions.

---

### Task 1: Core Notepad Data Model, Tab Operations & Migration Logic

**Files:**
- Create: `scratch/test_notepad_dual_mode.js`
- Modify: `note/note.js`

**Interfaces:**
- Consumes: `chrome.storage.local`
- Produces: Exported helper functions in `note/note.js` (for Node tests and browser runtime):
  - `createInitialState()`
  - `migrateLegacyNotes(legacyNotes)`
  - `addTab(state, title, content)`
  - `removeTab(state, tabId)`
  - `renameTab(state, tabId, newTitle)`
  - `updateTabContent(state, tabId, content)`
  - `selectTab(state, tabId)`
  - `calculateWordAndCharCount(text)`

- [ ] **Step 1: Write the failing unit tests for data model and migration**

Create `scratch/test_notepad_dual_mode.js`:
```javascript
const assert = require('assert');
const path = require('path');

// Mock Chrome APIs
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
const state = notepad.createInitialState();
assert.strictEqual(state.tabs.length, 1);
assert.strictEqual(state.activeTabId, state.tabs[0].id);
assert.strictEqual(state.tabs[0].title, 'Ghi chú 1');

// 2. Add Tab
const stateWith2 = notepad.addTab(state, 'Công việc', 'Nội dung test');
assert.strictEqual(stateWith2.tabs.length, 2);
assert.strictEqual(stateWith2.activeTabId, stateWith2.tabs[1].id);
assert.strictEqual(stateWith2.tabs[1].title, 'Công việc');

// 3. Rename Tab
const renamedState = notepad.renameTab(stateWith2, stateWith2.tabs[0].id, 'Checklist');
assert.strictEqual(renamedState.tabs[0].title, 'Checklist');

// 4. Update Content
const updatedState = notepad.updateTabContent(renamedState, renamedState.tabs[0].id, 'Hàng 1\nHàng 2');
assert.strictEqual(updatedState.tabs[0].content, 'Hàng 1\nHàng 2');

// 5. Word and Char Count
const counts = notepad.calculateWordAndCharCount('Xin chào Việt Nam 123');
assert.strictEqual(counts.words, 5);
assert.strictEqual(counts.chars, 22);

// 6. Delete Tab
const deletedState = notepad.removeTab(updatedState, stateWith2.tabs[1].id);
assert.strictEqual(deletedState.tabs.length, 1);
assert.strictEqual(deletedState.activeTabId, deletedState.tabs[0].id);

// 7. Migration from Legacy Notes
const legacyNotes = [
    { id: 101, text: 'Ghi chú số 1 từ trước', timestamp: '2026-09-01T08:00:00.000Z' },
    { id: 102, text: 'Ghi chú số 2', timestamp: '2026-09-02T08:00:00.000Z' }
];
const migratedState = notepad.migrateLegacyNotes(legacyNotes);
assert.strictEqual(migratedState.tabs.length, 2);
assert.strictEqual(migratedState.tabs[0].content, 'Ghi chú số 1 từ trước');
assert.strictEqual(migratedState.tabs[1].content, 'Ghi chú số 2');

console.log('✔ All Task 1 unit tests passed!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch/test_notepad_dual_mode.js`  
Expected: FAIL with missing functions.

- [ ] **Step 3: Implement data model and migration helpers in `note/note.js`**

Implement `createInitialState`, `migrateLegacyNotes`, `addTab`, `removeTab`, `renameTab`, `updateTabContent`, `selectTab`, and `calculateWordAndCharCount` with clean immutable state patterns and module export.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_notepad_dual_mode.js`  
Expected: PASS with "✔ All Task 1 unit tests passed!"

- [ ] **Step 5: Commit**

```bash
git add scratch/test_notepad_dual_mode.js note/note.js
git commit -m "feat(notepad): implement core multi-tab data model and legacy migration"
```

---

### Task 2: UI Structure & Styling for Multi-Tab Notepad (Windows 11 Style)

**Files:**
- Modify: `note/note.html`
- Modify: `note/note.css`

**Interfaces:**
- Consumes: Task 1 data model & CSS design tokens
- Produces:
  - Header with `#tabStrip` containing `.tab-item` elements and `#addTabBtn`
  - Action bar containing `#modeSwitchBtn`, `#privacyBtn`, `#copyAllBtn`, `#themeToggleBtn`
  - Editor container containing `#noteTextarea`
  - Footer containing `#statusBar` with `#wordCount`, `#charCount`, `#saveStatus`

- [ ] **Step 1: Write HTML and CSS markup test in `scratch/test_notepad_dual_mode.js`**

Add DOM checks verifying all required IDs and class names exist in `note/note.html` and `note/note.css`.

- [ ] **Step 2: Run test to verify failure**

Run: `node scratch/test_notepad_dual_mode.js`  
Expected: FAIL due to missing DOM elements.

- [ ] **Step 3: Implement `note/note.html` and `note/note.css`**

- In `note/note.html`: Build clean, accessible markup:
  - App header with tab strip, plus button, and top toolbar (mode switch, privacy mask, copy, dark theme toggle).
  - Main textarea with placeholder, spelling disable, and auto-focus.
  - Status bar with live counts and save indicator.
- In `note/note.css`:
  - Modern Windows 11 Fluent-inspired palette with Light & Dark theme variables.
  - Custom scrollbar, sleek tab styling with active state indicator and close `×` button.
  - Monospace/Inter editor styling with comfortable line height and padding.
  - Privacy blur filter (`filter: blur(8px)`) on `.privacy-blur`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_notepad_dual_mode.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add note/note.html note/note.css scratch/test_notepad_dual_mode.js
git commit -m "feat(notepad): create multi-tab notepad layout and modern styling"
```

---

### Task 3: Editor Interactions, Auto-Save & Dual-Mode Mechanics

**Files:**
- Modify: `note/note.js`

**Interfaces:**
- Consumes: DOM elements from Task 2, Data Model from Task 1
- Produces:
  - Live tab switching, creation, closing, and inline double-click renaming.
  - Debounced auto-save (300ms) to `chrome.storage.local`.
  - Tab key indentation handling in `<textarea>`.
  - 1-click Dual-Mode switcher:
    - In Tab Mode: click `#modeSwitchBtn` -> creates popup window and closes tab.
    - In Window Mode: click `#modeSwitchBtn` -> creates browser tab and closes popup window.
  - Privacy Mask toggle (`#privacyBtn`).
  - Dark Theme toggle (`#themeToggleBtn`) with persistence.
  - Quick Copy all button (`#copyAllBtn`).

- [ ] **Step 1: Write tests for editor interactions and mode switching**

In `scratch/test_notepad_dual_mode.js`, add test cases for:
- Mode detection logic (`isPopupWindow()`).
- Auto-save state synchronization.
- Privacy mask state persistence.

- [ ] **Step 2: Run test to verify failure**

Run: `node scratch/test_notepad_dual_mode.js`  
Expected: FAIL.

- [ ] **Step 3: Implement client-side controller in `note/note.js`**

Implement:
- Initialization: load `NotepadTabs` from storage or perform `migrateLegacyNotes()`.
- Render tabs strip and activate active tab content in textarea.
- Auto-save debouncing using `setTimeout`.
- Keyboard events: Tab key inserts 2 spaces, input updates counts and triggers auto-save.
- Mode detection and mode switch handler.
- Real-time `chrome.storage.onChanged` listener for cross-window synchronization.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_notepad_dual_mode.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add note/note.js scratch/test_notepad_dual_mode.js
git commit -m "feat(notepad): integrate auto-save, dual-mode switching, and editor interactions"
```

---

### Task 4: Popup Extension Dual-Mode Launch Integration

**Files:**
- Modify: `popup/popup.html`
- Modify: `popup/popup.css`
- Modify: `popup/popup.js`

**Interfaces:**
- Consumes: Chrome `windows` and `tabs` APIs
- Produces:
  - `#note-window-btn`: Opens `note/note.html` as a pop-out mini window (`width: 520, height: 640, type: 'popup'`).
  - `#note-tab-btn`: Opens `note/note.html` as a regular browser tab.
  - Backward compatibility: `#note-btn` continues to work (opens default preferred mode).

- [ ] **Step 1: Write tests for popup button existence and handlers**

Add assertions in `scratch/test_notepad_dual_mode.js` verifying the new buttons and attributes.

- [ ] **Step 2: Run test to verify failure**

Run: `node scratch/test_notepad_dual_mode.js`  
Expected: FAIL due to missing button IDs.

- [ ] **Step 3: Update `popup/popup.html`, `popup/popup.css`, and `popup/popup.js`**

- In `popup/popup.html`: Inside `.tools-grid`, provide:
  - Button: "Ghi chú (Cửa sổ) 🗗" (`#note-window-btn` or `#note-btn`)
  - Button: "Ghi chú (Tab) 📑" (`#note-tab-btn`)
- In `popup/popup.css`: Adjust grid styling so both buttons look neat and balanced.
- In `popup/popup.js`:
  - Wire window button to `chrome.windows.create({ url: chrome.runtime.getURL("note/note.html"), type: "popup", width: 520, height: 640 })`.
  - Wire tab button to `chrome.tabs.create({ url: chrome.runtime.getURL("note/note.html") })`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_notepad_dual_mode.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add popup/popup.html popup/popup.css popup/popup.js scratch/test_notepad_dual_mode.js
git commit -m "feat(popup): add dual-mode notepad launch buttons in tools tab"
```

---

### Task 5: Full Regression Testing & Polish

**Files:**
- Modify: `scratch/test_full_suite.js`

**Interfaces:**
- Consumes: All 6 existing test suites + `scratch/test_notepad_dual_mode.js`
- Produces: Unified regression execution ensuring 0 errors across extension.

- [ ] **Step 1: Add Notepad sub-suite to `scratch/test_full_suite.js`**

Add `runSubSuite('Notepad Multi-Tab Dual-Mode Subsystem', 'scratch/test_notepad_dual_mode.js');` to `scratch/test_full_suite.js`.

- [ ] **Step 2: Run comprehensive full regression suite**

Run: `node scratch/test_full_suite.js`  
Expected: ALL 7 SUB-SUITES PASS with 0 errors.

- [ ] **Step 3: Verify extension syntax**

Run: `node -c note/note.js; node -c popup/popup.js; node -c background.js`  
Expected: Clean exit code 0.

- [ ] **Step 4: Commit**

```bash
git add scratch/test_full_suite.js
git commit -m "chore(test): integrate notepad dual-mode suite into full regression pipeline"
```
