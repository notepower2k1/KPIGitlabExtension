# Kanban To-Do Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the "Việc cần làm" (Kanban To-Do) subsystem with Enter key task creation, task editing modal, collapsible reminder settings, HTML5 drag & drop card transitions, dual-mode launching (mini pop-out window vs browser tab), and responsive notification click handling.

**Architecture:** Enhancements across `todo/` (SPA), `popup/` (launch buttons), and `background.js` (notification click listener). State persists in `chrome.storage.local` key `todos`.

**Tech Stack:** Vanilla JavaScript (ES2022), HTML5 Drag & Drop API, CSS3 with Custom Properties, Chrome Extension Manifest V3 (`chrome.windows`, `chrome.tabs`, `chrome.storage.local`, `chrome.notifications`).

**Spec:** `docs/superpowers/specs/2026-10-01-kanban-todo-enhancements-design.md`

## Global Constraints
- Manifest V3 compliant: No external Google Fonts or remote resources in `todo/todo.html`.
- Preserve existing storage schema (`todos` array of `{ id, title, deadline, status }`).
- Backwards compatibility: Keep click arrow buttons (`◀`, `▶`) working alongside drag & drop.
- All existing features (KPI dashboard, GitLab quick links, check-in alerts, multi-tab notepad) must experience zero regressions.

---

### Task 1: Ergonomics, Task Editing & Collapsible Settings

**Files:**
- Create: `scratch/test_todo_enhancements.js`
- Modify: `todo/todo.html`
- Modify: `todo/todo.css`
- Modify: `todo/todo.js`

**Interfaces:**
- Consumes: `chrome.storage.local` key `todos`
- Produces:
  - Enter key listener on `#todo-input` and `#deadline-input`
  - Edit task modal `#editModal` with inputs `#edit-task-title`, `#edit-task-deadline`, `#save-edit-btn`, `#close-edit-btn`
  - Exported pure helpers in `todo/todo.js`:
    - `addTodoItem(todos, title, deadline)`
    - `updateTodoItem(todos, id, newTitle, newDeadline)`
    - `changeTodoStatus(todos, id, newStatus)`
    - `deleteTodoItem(todos, id)`
  - Collapsible reminder settings toggle `#toggleReminderBtn`

- [ ] **Step 1: Write the failing unit tests for task operations & editing**

Create `scratch/test_todo_enhancements.js` testing pure functions:
- `addTodoItem`: adds task with status 'todo' and unique id
- `updateTodoItem`: modifies title and deadline cleanly
- `changeTodoStatus`: transitions status between todo, processing, done
- `deleteTodoItem`: removes task by id

- [ ] **Step 2: Run test to verify it fails**

Run: `node scratch/test_todo_enhancements.js`  
Expected: FAIL with missing functions.

- [ ] **Step 3: Implement task editing, Enter key, and collapsible settings**

- In `todo/todo.js`:
  - Implement and conditionally export pure helper functions (`addTodoItem`, `updateTodoItem`, `changeTodoStatus`, `deleteTodoItem`).
  - Add Enter key listener on `#todo-input` and `#deadline-input` calling `handleAddTodo()`.
  - Add Edit button on each task card (`.btn-edit-task`) opening `#editModal`.
  - Add save edit listener updating task and calling `renderKanban()`.
  - Add toggle listener for reminder settings `#toggleReminderBtn`.
- In `todo/todo.html`:
  - Remove external Google Fonts link tag.
  - Add Edit modal markup (`#editModal`).
  - Add collapsible wrapper around reminder settings.
- In `todo/todo.css`:
  - Style modal, edit button, and collapsible reminder panel.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_todo_enhancements.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add todo/todo.html todo/todo.css todo/todo.js scratch/test_todo_enhancements.js
git commit -m "feat(todo): add enter key submission, task editing modal, and collapsible settings"
```

---

### Task 2: HTML5 Drag & Drop for Kanban Columns

**Files:**
- Modify: `todo/todo.html`
- Modify: `todo/todo.css`
- Modify: `todo/todo.js`
- Test: `scratch/test_todo_enhancements.js`

**Interfaces:**
- Consumes: Task cards in `.task-list`, columns `#col-todo`, `#col-processing`, `#col-done`
- Produces:
  - Drag events: `dragstart`, `dragend`, `dragover`, `dragleave`, `drop`
  - Visual class `.drag-over` on target column during hover
  - Card `.is-dragging` styling with opacity
  - Persisted status update on drop

- [ ] **Step 1: Add drag & drop logic assertions in `scratch/test_todo_enhancements.js`**

Add tests verifying card draggable attribute and drop target status resolution helper `resolveTargetStatusFromColumn(columnId)`.

- [ ] **Step 2: Run test to verify failure**

Run: `node scratch/test_todo_enhancements.js`  
Expected: FAIL.

- [ ] **Step 3: Implement HTML5 Drag & Drop in `todo/todo.js` and `todo/todo.css`**

- In `todo/todo.js`:
  - Set `draggable="true"` on `.task-card`.
  - Attach `dragstart` setting `e.dataTransfer.setData('text/plain', todo.id)`.
  - Attach `dragover` (with `e.preventDefault()`) and `dragleave` on `.task-list` / `.kanban-column` toggling `.drag-over`.
  - Attach `drop` retrieving task ID, calling `changeTodoStatus()`, saving to storage, and re-rendering.
- In `todo/todo.css`:
  - Add styles for `.task-card.is-dragging` (semi-transparent, dashed border) and `.drag-over` (subtle primary highlight, dashed border).

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_todo_enhancements.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add todo/todo.js todo/todo.css scratch/test_todo_enhancements.js
git commit -m "feat(todo): implement HTML5 drag and drop across kanban columns"
```

---

### Task 3: Dual-Mode Launching & Notification Click Handling

**Files:**
- Modify: `todo/todo.html`
- Modify: `todo/todo.js`
- Modify: `popup/popup.html`
- Modify: `popup/popup.css`
- Modify: `popup/popup.js`
- Modify: `background.js`
- Test: `scratch/test_todo_enhancements.js`

**Interfaces:**
- Consumes: Chrome `windows`, `tabs`, and `notifications` APIs
- Produces:
  - In `todo/todo.html`: Mode switch button `#modeSwitchBtn` ("Tách ra cửa sổ riêng 🗗" / "Mở dạng Tab 🗖")
  - In `popup/popup.html`:
    - `#todo-btn`: "Việc cần làm (Cửa sổ) 🗗" (opens 540x680 popup window)
    - `#todo-tab-btn`: "Việc cần làm (Tab) 📑" (opens full browser tab)
  - In `background.js`: Notification click handler opens `todo/todo.html` for todo notifications

- [ ] **Step 1: Add dual-mode and notification handler tests in `scratch/test_todo_enhancements.js`**

Add tests checking:
- `#modeSwitchBtn` exists in `todo/todo.html`
- `#todo-btn` and `#todo-tab-btn` exist in `popup/popup.html`
- `background.js` notification click listener correctly routes todo IDs to open `todo/todo.html`

- [ ] **Step 2: Run test to verify failure**

Run: `node scratch/test_todo_enhancements.js`  
Expected: FAIL.

- [ ] **Step 3: Implement Dual-Mode & Notification Click Handling**

- In `todo/todo.html`: Add `#modeSwitchBtn` in `.header-right`.
- In `todo/todo.js`: Add mode detection (`detectWindowMode`) and mode switch handler.
- In `popup/popup.html` & `popup/popup.css`: Update `.tools-grid` with `#todo-btn` ("Việc cần làm (Cửa sổ) 🗗") and `#todo-tab-btn` ("Việc cần làm (Tab) 📑").
- In `popup/popup.js`: Wire `#todo-btn` to `chrome.windows.create` (540x680, type 'popup') and `#todo-tab-btn` to `chrome.tabs.create`.
- In `background.js`: In `chrome.notifications.onClicked`, if `notifId` is not checkin/checkout alert, open `todo/todo.html` and clear notification.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scratch/test_todo_enhancements.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add todo/todo.html todo/todo.js popup/popup.html popup/popup.css popup/popup.js background.js scratch/test_todo_enhancements.js
git commit -m "feat(todo): add dual-mode launching and notification click routing"
```

---

### Task 4: Full Regression Testing & Pipeline Integration

**Files:**
- Modify: `scratch/test_full_suite.js`

**Interfaces:**
- Consumes: All 7 existing test suites + `scratch/test_todo_enhancements.js`
- Produces: 8/8 test suites passing, extension-wide syntax checks, CSP checks

- [ ] **Step 1: Add To-Do sub-suite to `scratch/test_full_suite.js`**

Add `runSubSuite('Kanban To-Do Enhancements Subsystem', 'scratch/test_todo_enhancements.js');` and include `todo/todo.js` in `node -c` checks, and `todo/todo.html` in CSP checks.

- [ ] **Step 2: Run full regression test suite**

Run: `node scratch/test_full_suite.js`  
Expected: ALL 8 SUB-SUITES PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add scratch/test_full_suite.js
git commit -m "chore(test): integrate kanban todo enhancements into full regression suite"
```
