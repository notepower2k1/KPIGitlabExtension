# Design Specification: Extension-wide Multilingual (i18n VI / EN) System

**Date:** 2026-10-01  
**Author:** Antigravity & User  
**Status:** APPROVED  
**Target:** Chrome Extension (Manifest V3)

---

## 1. Context & Motivation
Currently, the extension UI contains an inconsistent mixture of Vietnamese and English (e.g. "GitLab Productivity Popup" and "KPI Dashboard" alongside "Bảng Việc Cần Làm (Kanban)", "Sổ tay ghi chú", "Chưa thêm", and "Doing"). In preparation for publishing to the Chrome Web Store, the extension requires an architectural multilingual internationalization (i18n) system supporting both **Tiếng Việt (VI)** and **English (EN)**.

Key goals:
1. Provide a single, complete dictionary for all user-facing strings across all extension surfaces.
2. Auto-detect user browser language on first launch (`chrome.i18n.getUILanguage()`), defaulting to `vi` if starting with `vi`, otherwise `en`.
3. Provide an intuitive in-app language switcher (`VI 🇻🇳 | EN 🇬🇧`) accessible on both the Login/Token screen and within Extension Settings.
4. Support instant runtime re-rendering across open pages (`popup`, `page`, `todo`, `note`, `content_issue.js`) upon language change without requiring browser reload.
5. Translate background desktop notifications (`background.js`) dynamically based on stored language preference.
6. Zero external dependencies, 100% Manifest V3 CSP compliant.

---

## 2. Architecture & Core Components

### 2.1 The `i18n.js` Engine
A standalone, lightweight module loaded across all HTML surfaces (`popup`, `page`, `todo`, `note`) and imported in `background.js` and `content_issue.js`.

```javascript
// i18n.js structure
const I18N_DICTIONARIES = {
    vi: { /* key-value pairs */ },
    en: { /* key-value pairs */ }
};
```

Core API functions:
- `t(key, params, lang)`: Translates `key`. If `params` is provided (e.g. `{ count: 3 }`), interpolates `{key}` placeholders. Falls back to `en` if key is missing in `vi`, or returns `key` if missing in both.
- `getCurrentLanguage()`: Returns current stored language (`'vi'` or `'en'`), defaulting to detected browser language.
- `setLanguage(lang)`: Persists language to `chrome.storage.local.set({ appLanguage: lang })` and broadcasts change.
- `applyI18n(rootElement, lang)`: Scans DOM elements under `rootElement` with attributes:
  - `data-i18n="key"`: sets `textContent = t(key, null, lang)`
  - `data-i18n-placeholder="key"`: sets `placeholder = t(key, null, lang)`
  - `data-i18n-title="key"`: sets `title = t(key, null, lang)`
  - `data-i18n-aria="key"`: sets `setAttribute('aria-label', t(key, null, lang))`

### 2.2 Extension Surfaces to Translate

1. **Popup (`popup/popup.html`, `popup/popup.js`)**:
   - Language selector on `#login-screen` and within `#tools-tab`.
   - Login prompts, token inputs, buttons ("Kết nối ngay" / "Connect Now", "Hướng dẫn" / "Tutorial").
   - Navigation tabs: "Trang chủ" / "Home", "Ghi chú" / "Notes", "Việc cần làm" / "To-Do", "Tiện ích" / "Tools".
   - Warning banner: "Bạn có {count} task tạo hôm nay..." / "You have {count} task(s) created today not yet added to KPI!".
   - Check-in/out card settings, labels, snooze options, action buttons.
   - Tool launcher buttons (Window / Tab modes, Export / Import).

2. **Main Dashboard (`page/page.html`, `page/page.js`)**:
   - Header, tab buttons ("Bảng công việc" / "Work Items", "Phân tích KPI" / "Analytics").
   - Controls panel, filters ("Tuần này" / "This Week", "Tháng này" / "This Month", "Tất cả" / "All").
   - KPI health cards ("Chỉ số KPI", "Tỉ lệ đúng hạn", "Thái độ", "Khối lượng", "Chất lượng").
   - Table headers (Task, Assignee, Estimate, Spent, Diff, Status, Action).
   - Status badges ("Đang làm" / "Doing", "Hoàn thành" / "Done", "Tồn đọng" / "Carry Over").
   - Daily timesheet audit section ("Bảng chấm công", "Giờ chuẩn", "Tăng ca", "Đi muộn").
   - Charts legend and axis labels.

3. **Kanban Board (`todo/todo.html`, `todo/todo.js`)**:
   - Board title ("Bảng Việc Cần Làm (Kanban)" / "Kanban To-Do Board").
   - Column headers: "Cần làm" / "To Do", "Đang xử lý" / "In Progress", "Hoàn thành" / "Done".
   - Task composer: "Thêm việc mới..." / "Add new task...", "Hạn chót" / "Deadline", "+ Thêm" / "+ Add".
   - Task edit modal: "Chỉnh sửa công việc" / "Edit Task", "Lưu thay đổi" / "Save Changes", "Hủy" / "Cancel".
   - Mode switcher button ("Tách ra cửa sổ riêng" / "Pop-out Window", "Mở dạng Tab" / "Open in Tab").

4. **Notepad (`note/note.html`, `note/note.js`)**:
   - Header title ("Sổ tay ghi chú" / "Quick Notes").
   - Tab actions, placeholder ("Bắt đầu nhập nội dung ghi chú..." / "Start typing your note here...").
   - Status ("Tự động lưu" / "Auto-saved", "Đang lưu..." / "Saving...").

5. **In-Page GitLab Enhancements (`content_issue.js`)**:
   - Header button: "📊 Tổng hợp task" / "📊 Task Summary".
   - Standalone/Tree buttons: "➕ Thêm vào KPI" / "➕ Add to KPI", "✔ Đã thêm vào KPI" / "✔ Added to KPI".
   - Summary modal: Metrics cards ("Tổng task", "Tổng ước tính", "Tổng thực tế", "Chênh lệch", "Đúng hạn"), batch add button, table columns.

6. **Background Notifications (`background.js`)**:
   - Check-in notification: "Nhắc nhở chấm công vào ca" / "Check-in Reminder".
   - Check-out notification: "Nhắc nhở chấm công về" / "Check-out Reminder".
   - End-of-day unadded KPI alert: "Nhắc nhở KPI cuối ngày" / "End-of-Day KPI Reminder".

---

## 3. Storage & Synchronization
- Storage key: `appLanguage: 'vi' | 'en'`.
- Synchronized across all components via `chrome.storage.onChanged`:
  - When user changes language in Popup or Page, all active pages listen to `changes.appLanguage` and invoke `applyI18n()` to re-render without reload.

---

## 4. Verification & Testing Strategy
1. **Dictionary Parity Test (`scratch/test_i18n.js`)**:
   - Verify every key present in `vi` exists in `en` with identical placeholder tokens.
   - Verify parameter replacement (e.g. `{count}`).
   - Verify fallback logic when key or locale is missing.
2. **DOM Translation Test**:
   - Verify mock elements with `data-i18n`, `data-i18n-placeholder`, `data-i18n-title` update correctly on locale switch.
3. **Storage & Event Propagation Test**:
   - Verify `setLanguage` updates storage and triggers reactive updates.
4. **Full Regression Suite Integration**:
   - Registered as Suite 11 in `scratch/test_full_suite.js`.
   - All 11 suites and 22+ syntax/security checks must pass 100% green.
