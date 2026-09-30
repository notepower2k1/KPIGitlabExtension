# Design Document: Kanban To-Do Subsystem Enhancements

**Document Version:** 1.0.0  
**Date:** 2026-10-01  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Overview & Problem Statement

The "Việc cần làm" (Kanban To-Do) feature helps users organize daily tasks and provides periodic deadline notifications. Several ergonomic and architectural issues currently limit its effectiveness:
1. **No Enter Key Submission:** Users must click the "Thêm công việc" button with the mouse; pressing `Enter` in the title input does nothing.
2. **Missing Edit Capability:** Tasks can only be moved or deleted. Changing typos or extending deadlines requires deleting and recreating tasks.
3. **Dead Notification Clicks:** Clicking a To-Do reminder notification in Windows/Chrome does not open or focus the Kanban page.
4. **External Font Dependency:** `todo/todo.html` references Google Fonts over the internet, violating offline CSP principles.
5. **No Window/Tab Dual-Mode:** Tasks are always opened in a full-screen browser tab, preventing users from docking a compact Kanban board beside their code or IDE.
6. **No Drag & Drop:** Tasks can only be transitioned using small arrow buttons.
7. **Cluttered Composer Area:** Reminder configuration inputs occupy prime real estate in the composer.

---

## 2. Key Enhancements & Architecture

### 2.1 Dual-Mode Mechanics
- **Pop-out Mini Window Mode (`540x680px`):** Compact, frameless window launched via `chrome.windows.create({ type: 'popup', width: 540, height: 680 })`.
- **Browser Tab Mode:** Standard tab via `chrome.tabs.create`.
- **1-Click Mode Switcher:** Top bar of `todo/todo.html` contains `#modeSwitchBtn` to seamlessly switch between window and tab modes.
- **Popup Integration:** In `popup/popup.html`, provide quick dual-mode launching:
  - `Việc cần làm (Cửa sổ) 🗗` (`#todo-window-btn` or `#todo-btn`)
  - `Việc cần làm (Tab) 📑` (`#todo-tab-btn`)

### 2.2 Task Composer Ergonomics
- **Enter to Add:** Pressing `Enter` in `#todo-input` or `#deadline-input` immediately triggers `handleAddTodo()`.
- **Streamlined Reminder Settings:** Replaced permanent inputs with a collapsible/popover toggle button (`#toggleReminderBtn` ⚙️) that reveals notification interval configuration on demand.

### 2.3 Task Editing Support
- Each task card gains an **Edit button** (`✎`) alongside the delete button.
- Clicking Edit opens a clean modal `#editTodoModal` allowing users to edit the title, adjust the deadline, and save changes with instant Kanban re-rendering.

### 2.4 HTML5 Drag & Drop
- Task cards are draggable (`draggable="true"`).
- Dragging a card over a column highlights it with `.drag-over`.
- Dropping updates the task's status (`todo`, `processing`, `done`) and persists to `chrome.storage.local`.
- Backward-compatible arrow buttons (`◀`, `▶`) remain available for click/touch navigation.

### 2.5 Notification Click Handler
- In `background.js`, when a notification with a task ID is clicked:
  - Clear the notification.
  - Open `todo/todo.html` via `chrome.tabs.create({ url: chrome.runtime.getURL("todo/todo.html") })` (or open/focus window).

### 2.6 Manifest V3 CSP Compliance
- Remove external Google Fonts from `todo/todo.html`.
- Use the modern native system font stack: `'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif`.

---

## 3. Storage Schema & Integrity

Continues using the existing key `todos` in `chrome.storage.local`:
```typescript
interface TodoItem {
  id: string;              // timestamp string
  title: string;           // task title
  deadline?: string;       // ISO datetime string
  status: 'todo' | 'processing' | 'done';
}
```
Settings continue using `reminderMinutesBefore` and `reminderRepeatMinutes`.

---

## 4. Verification Plan

1. **Unit & Integration Suite (`scratch/test_todo_enhancements.js`):**
   - Test Enter key triggers task creation.
   - Test Task editing updates title and deadline.
   - Test Task drag & drop status transition.
   - Test Notification click handler opens `todo.html`.
   - Test DOM structure, modal, and CSP compliance in `todo/todo.html`.
2. **Comprehensive Full Suite (`scratch/test_full_suite.js`):**
   - Run all 8 test suites.
   - Run extension-wide syntax checks (`node -c`).
