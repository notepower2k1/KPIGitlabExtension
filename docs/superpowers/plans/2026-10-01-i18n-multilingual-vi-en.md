# Implementation Plan: Extension-wide Multilingual (i18n VI / EN) System

**Date:** 2026-10-01  
**Spec Reference:** `docs/superpowers/specs/2026-10-01-i18n-multilingual-vi-en-design.md`  
**Methodology:** Subagent-Driven Development (SDD) with strict TDD and review gates  
**Target:** Chrome Extension (Manifest V3)

---

## Task 1: Core i18n Engine & Complete Dictionary (`i18n.js`)

### Objective
Create the standalone `i18n.js` engine containing complete Vietnamese (`vi`) and English (`en`) dictionaries, translation helper `t(key, params, lang)`, browser language detection, storage persistence, and declarative DOM attribute translator `applyI18n(rootElement, lang)`.

### Files Modified / Created
- `i18n.js` (NEW)
- `scratch/test_i18n.js` (NEW)

### Steps
1. Write unit tests in `scratch/test_i18n.js`:
   - Test dictionary parity: 100% of keys in `vi` must exist in `en` with identical parameter placeholders (e.g. `{count}`).
   - Test `t(key, params, lang)` with direct translation and variable substitution.
   - Test fallback to `'en'` when key or language is invalid, and fallback to raw `key` if missing in both.
   - Test `applyI18n` on mock DOM elements with `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-aria`.
   - Test `setLanguage` storage interaction.
2. Run `node scratch/test_i18n.js` to verify failure (RED).
3. Implement `i18n.js` with comprehensive dictionaries covering all extension surfaces.
4. Run `node scratch/test_i18n.js` to verify all tests pass (GREEN).
5. Verify syntax with `node -c i18n.js`.
6. Commit:
   `git add i18n.js scratch/test_i18n.js`
   `git commit -m "feat(i18n): create core dictionary engine and translation utilities"`

---

## Task 2: Popup Interface & Background Notifications Integration

### Objective
Wire i18n into `popup/popup.html`, `popup/popup.css`, `popup/popup.js`, and `background.js`. Add an in-app language switcher (`VI 🇻🇳 | EN 🇬🇧`) to both the Login screen and Settings card, and localize background desktop notifications.

### Files Modified
- `popup/popup.html`
- `popup/popup.css`
- `popup/popup.js`
- `background.js`
- `scratch/test_i18n.js`

### Steps
1. Add test assertions in `scratch/test_i18n.js`:
   - Verify language switcher elements exist in `popup/popup.html`.
   - Verify `popup.js` initializes language, responds to switcher clicks, and invokes `applyI18n`.
   - Verify `background.js` generates localized notification titles and messages based on stored `appLanguage`.
2. Run `node scratch/test_i18n.js` to verify failure (RED).
3. Update `popup/popup.html` and `popup/popup.css` with language switcher controls and `data-i18n` attributes.
4. Update `popup/popup.js` to import `i18n.js`, wire switcher change events, and call `applyI18n()`.
5. Update `background.js` to import `i18n.js` and use `t()` for check-in, check-out, and unadded task notifications.
6. Run `node scratch/test_i18n.js` and `node scratch/test_checkin_checkout.js` to verify GREEN.
7. Verify syntax: `node -c popup/popup.js background.js`.
8. Commit:
   `git add popup/popup.html popup/popup.css popup/popup.js background.js scratch/test_i18n.js`
   `git commit -m "feat(popup): add language switcher and localize popup UI and desktop alerts"`

---

## Task 3: Dashboard, Kanban, Notepad & In-Page GitLab Integration

### Objective
Wire i18n into the remaining extension surfaces: Main Dashboard (`page/`), Kanban Board (`todo/`), Notepad (`note/`), and GitLab in-page summary modal (`content_issue.js`).

### Files Modified
- `page/page.html`, `page/page.js`
- `todo/todo.html`, `todo/todo.js`
- `note/note.html`, `note/note.js`
- `content_issue.js`
- `scratch/test_i18n.js`

### Steps
1. Add test assertions in `scratch/test_i18n.js`:
   - Verify `data-i18n` attributes across `page/page.html`, `todo/todo.html`, and `note/note.html`.
   - Verify `content_issue.js` generates localized buttons ("📊 Tổng hợp task" vs "📊 Task Summary") and modal headers based on stored language.
   - Verify reactive listener `chrome.storage.onChanged` updates UI when `appLanguage` changes.
2. Run `node scratch/test_i18n.js` to verify failure (RED).
3. Add `<script src="../i18n.js"></script>` and `data-i18n` attributes to `page/page.html`, `todo/todo.html`, `note/note.html`.
4. Update `page/page.js`, `todo/todo.js`, `note/note.js` to call `applyI18n()` on load and on `chrome.storage.onChanged` for `appLanguage`.
5. Update `content_issue.js` to read `appLanguage` from storage and render localized button labels and modal elements.
6. Run `node scratch/test_i18n.js` to verify GREEN.
7. Verify syntax: `node -c page/page.js todo/todo.js note/note.js content_issue.js`.
8. Commit:
   `git add page/page.html page/page.js todo/todo.html todo/todo.js note/note.html note/note.js content_issue.js scratch/test_i18n.js`
   `git commit -m "feat(i18n): localize dashboard, kanban board, notepad, and gitlab modal"`

---

## Task 4: Pipeline Integration & Full Regression Testing

### Objective
Integrate `scratch/test_i18n.js` as Suite 11 into `scratch/test_full_suite.js`, ensure all 11 test suites and 22+ security & syntax checks pass 100% green.

### Files Modified
- `scratch/test_full_suite.js`

### Steps
1. In `scratch/test_full_suite.js`:
   - Register `scratch/test_i18n.js` as Suite 11 in `runSubSuite`.
   - Add `i18n.js` to `jsFilesToValidate` syntax validation list.
   - Verify all HTML files pass MV3 CSP checks with `i18n.js` script tag (strictly local file).
2. Run `node scratch/test_full_suite.js` and verify all 11 sub-suites pass 100% green.
3. Commit:
   `git add scratch/test_full_suite.js`
   `git commit -m "chore(test): integrate multilingual i18n suite into full regression pipeline"`
4. Run final whole-branch review across diff.
