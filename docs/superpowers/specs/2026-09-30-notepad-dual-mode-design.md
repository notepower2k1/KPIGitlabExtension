# Design Document: Notepad Multi-Tab Dual-Mode Subsystem

**Document Version:** 1.0.0  
**Date:** 2026-09-30  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Overview & Problem Statement

Users often rely on Windows Notepad for fast, low-friction scratchpad notes during daily work. In the previous implementation:
- Notes were opened as a full browser tab (`chrome.tabs.create`).
- Writing a note required clicking an "Add" button with structured cards and modal edits, which disrupted the quick "type and forget" habit of Notepad.
- Users had no way to keep a small, focused floating notepad on their screen beside VS Code or GitLab.
- Conversely, users occasionally need to conceal sensitive notes during video calls, screen-sharing sessions, or when colleagues are nearby.

### Goals
1. **Dual-Mode Opening:**
   - **Pop-out Mini Window Mode (`chrome.windows.create({ type: 'popup' })`):** Frameless, compact window (~520x640px) that can sit alongside active work windows like native Notepad.
   - **Full Browser Tab Mode (`chrome.tabs.create`):** Classic browser tab mode when full screen is desired or to keep notes hidden among browser tabs.
   - **1-Click Seamless Mode Switching:** Switch between window and tab modes with a single click inside `note/note.html`.
2. **Multi-Tab Notepad (Windows 11 Style):**
   - Tab bar at the top supporting multiple independent note tabs (`Tab 1`, `Tab 2`, `+`).
   - Add new tab, close tab, double-click or right-click to rename tab.
3. **Frictionless Real-time Auto-save:**
   - Content automatically persists to `chrome.storage.local` with debounced auto-save (300ms) per keystroke.
   - Zero "Save" button clicks needed.
4. **Privacy & Security Mask:**
   - Instant "Eye" button (`👁️`) to blur / mask note contents when screen-sharing or when coworkers walk by.
5. **Data Continuity & Backward Compatibility:**
   - Automatically migrate any pre-existing notes from `Notes` into tabs so no past data is lost.

---

## 2. Architecture & Component Design

### 2.1 File Organization
- `note/note.html`: Structural markup for the multi-tab notepad application.
- `note/note.css`: Modern styling supporting light/dark themes, responsive tab bar, clean textarea typography, status bar, and blur privacy mask.
- `note/note.js`: Tab state management, auto-save, mode detection/switching, word/character counting, clipboard copy, and migration.
- `popup/popup.html`: Updated Tools tab with dual-mode launch buttons ("Cửa sổ rời 🗗" and "Tab trình duyệt 📑").
- `popup/popup.js`: Event listeners to launch `note/note.html` as a window or a tab.
- `scratch/test_notepad_dual_mode.js`: Automated test suite covering tab management, migration, storage contracts, and syntax.

---

## 3. Data Schema & Migration

### 3.1 Storage Schema (`chrome.storage.local`)
Stored under key `NotepadTabs`:
```typescript
interface NotepadTab {
  id: string;          // Unique ID, e.g. "tab-1727715000000"
  title: string;       // Display title, e.g. "Ghi chú 1"
  content: string;     // Raw text content
  updatedAt: number;   // Timestamp of last update
}

interface NotepadData {
  activeTabId: string;
  tabs: NotepadTab[];
  theme?: 'light' | 'dark';
  privacyMask?: boolean;
}
```

### 3.2 Legacy Migration
When the notepad loads:
1. Check if `NotepadTabs` exists.
2. If `NotepadTabs` does not exist:
   - Check if legacy `Notes` array exists.
   - If legacy notes exist, convert each item `{ id, text, timestamp }` into a `NotepadTab` with `title = text.slice(0, 20) || "Ghi chú cũ"` and `content = text`.
   - If no legacy notes exist, create default `[ { id: "tab-1", title: "Ghi chú 1", content: "", updatedAt: Date.now() } ]`.
   - Save to `NotepadTabs`.

---

## 4. Dual-Mode Mechanics

### 4.1 Mode Detection
`note/note.js` inspects `window.opener` and `chrome.windows.getCurrent()`:
- If `win.type === 'popup'`, the application is currently running in **Pop-out Window Mode**.
- Otherwise, it is running in **Browser Tab Mode**.

### 4.2 Mode Switching
- **Pop-out button clicked:**
  1. Calls `chrome.windows.create({ url: chrome.runtime.getURL("note/note.html"), type: "popup", width: 520, height: 640 })`.
  2. Closes the current tab via `window.close()`.
- **Open in Tab button clicked:**
  1. Calls `chrome.tabs.create({ url: chrome.runtime.getURL("note/note.html") })`.
  2. Closes the current popup window via `window.close()`.

---

## 5. UI & Interaction Details

### 5.1 Top Navigation Bar
- **Tab Strip:**
  - Active tab highlighted with accent bottom border or pill background.
  - Close button `×` on tabs (if > 1 tab).
  - Plus button `+` to add a new tab.
  - Double-click to edit tab name in-place with `<input class="tab-rename-input">`.
- **Top Actions:**
  - `👁️`: Toggle Privacy Mask (adds `.privacy-blur` to editor).
  - `🌓`: Toggle Light / Dark theme.
  - `📋`: Copy all text from active tab.
  - `🗗` / `🗖`: Switch between Pop-out Window Mode and Tab Mode.

### 5.2 Editor Area
- Single auto-expanding or 100% flex `<textarea>` styled with crisp font (`'JetBrains Mono', 'Consolas', 'Segoe UI', monospace`).
- Tab key indentation handling (inserts 2 spaces or tab instead of moving focus).
- Keystroke listener triggers debounced auto-save (300ms).

### 5.3 Bottom Status Bar
- `Đã lưu ✔` / `Đang lưu...` indicator.
- Word count and character count (`X từ | Y ký tự`).
- Current tab last updated time.

---

## 6. Verification & Test Plan

1. **Unit & Integration Tests (`scratch/test_notepad_dual_mode.js`):**
   - Test tab operations (create tab, delete tab, select tab, rename tab).
   - Test auto-save debouncing & persistence.
   - Test legacy data migration from `Notes` to `NotepadTabs`.
   - Test DOM structure and required elements in `note/note.html` and `popup/popup.html`.
   - Test extension-wide syntax validation (`node -c`).
2. **Full Regression Suite:**
   - Execute `node scratch/test_full_suite.js` to guarantee zero regressions across all extension modules.
