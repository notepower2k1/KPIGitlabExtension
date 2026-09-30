// ==========================================
// Notepad Multi-Tab Pure Data Model & Helpers
// ==========================================

function generateTabId() {
    return 'tab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
}

function createInitialState() {
    const id = generateTabId();
    return {
        activeTabId: id,
        tabs: [
            {
                id: id,
                title: 'Ghi chú 1',
                content: '',
                updatedAt: Date.now()
            }
        ]
    };
}

function addTab(state, title, content = '') {
    const existingTabs = (state && Array.isArray(state.tabs)) ? state.tabs : [];
    const tabNum = existingTabs.length + 1;
    const tabTitle = (typeof title === 'string' && title.trim()) ? title.trim() : `Ghi chú ${tabNum}`;
    const newTab = {
        id: generateTabId(),
        title: tabTitle,
        content: typeof content === 'string' ? content : '',
        updatedAt: Date.now()
    };
    return {
        ...(state || {}),
        activeTabId: newTab.id,
        tabs: [...existingTabs, newTab]
    };
}

function removeTab(state, tabId) {
    if (!state || !Array.isArray(state.tabs)) return createInitialState();
    const tabIndex = state.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return { ...state };

    const remainingTabs = state.tabs.filter(t => t.id !== tabId);
    if (remainingTabs.length === 0) {
        return createInitialState();
    }

    let nextActiveId = state.activeTabId;
    if (state.activeTabId === tabId) {
        const nextIndex = Math.min(tabIndex, remainingTabs.length - 1);
        nextActiveId = remainingTabs[nextIndex].id;
    }

    return {
        ...state,
        activeTabId: nextActiveId,
        tabs: remainingTabs
    };
}

function renameTab(state, tabId, newTitle) {
    if (!state || !Array.isArray(state.tabs)) return state;
    const trimmedTitle = (typeof newTitle === 'string' && newTitle.trim()) ? newTitle.trim() : 'Ghi chú';
    const tabs = state.tabs.map(tab => {
        if (tab.id === tabId) {
            return {
                ...tab,
                title: trimmedTitle,
                updatedAt: Date.now()
            };
        }
        return tab;
    });
    return {
        ...state,
        tabs
    };
}

function updateTabContent(state, tabId, content) {
    if (!state || !Array.isArray(state.tabs)) return state;
    const newContent = typeof content === 'string' ? content : '';
    const tabs = state.tabs.map(tab => {
        if (tab.id === tabId) {
            return {
                ...tab,
                content: newContent,
                updatedAt: Date.now()
            };
        }
        return tab;
    });
    return {
        ...state,
        tabs
    };
}

function selectTab(state, tabId) {
    if (!state || !Array.isArray(state.tabs)) return state;
    const tabExists = state.tabs.some(tab => tab.id === tabId);
    if (!tabExists) return { ...state };
    return {
        ...state,
        activeTabId: tabId
    };
}

function calculateWordAndCharCount(text) {
    if (!text || typeof text !== 'string') {
        return { words: 0, chars: 0 };
    }
    const trimmed = text.trim();
    const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    return { words, chars };
}

function migrateLegacyNotes(legacyNotes) {
    if (!Array.isArray(legacyNotes) || legacyNotes.length === 0) {
        return createInitialState();
    }
    const tabs = legacyNotes.map((note, index) => {
        const text = (note && typeof note.text === 'string') ? note.text : '';
        let title = '';
        if (text) {
            const firstLine = text.split('\n')[0].trim();
            title = firstLine.slice(0, 20);
        }
        title = title || 'Ghi chú cũ';
        const tabId = (note && note.id != null) ? `tab-${note.id}` : `tab-${Date.now()}-${index}`;
        const updatedAt = (note && note.timestamp) ? new Date(note.timestamp).getTime() : Date.now();
        return {
            id: tabId,
            title: title,
            content: text,
            updatedAt: isNaN(updatedAt) ? Date.now() : updatedAt
        };
    });

    return {
        activeTabId: tabs[0].id,
        tabs
    };
}

function detectWindowMode(win) {
    return (win && win.type === 'popup') ? 'window' : 'tab';
}

function handleTabKeyIndentation(textarea) {
    if (!textarea) return null;
    const start = (textarea.selectionStart !== undefined) ? textarea.selectionStart : textarea.value.length;
    const end = (textarea.selectionEnd !== undefined) ? textarea.selectionEnd : textarea.value.length;
    const val = textarea.value || '';
    const insert = '  ';
    textarea.value = val.substring(0, start) + insert + val.substring(end);
    textarea.selectionStart = start + insert.length;
    textarea.selectionEnd = start + insert.length;
    return {
        value: textarea.value,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd
    };
}

function createDebouncedSaver(saveFn, delayMs = 300) {
    let timer = null;
    let pendingData = null;
    return {
        trigger(data) {
            pendingData = data;
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                timer = null;
                const d = pendingData;
                pendingData = null;
                saveFn(d);
            }, delayMs);
        },
        async flush() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            if (pendingData !== null) {
                const d = pendingData;
                pendingData = null;
                return await saveFn(d);
            }
            return Promise.resolve();
        },
        cancel() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            pendingData = null;
        },
        isPending() {
            return timer !== null || pendingData !== null;
        }
    };
}

function applyTheme(theme, doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return theme;
    const isDark = theme === 'dark';
    if (doc.documentElement) {
        doc.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
    if (doc.body && doc.body.classList) {
        if (isDark) {
            doc.body.classList.add('dark-theme');
        } else {
            doc.body.classList.remove('dark-theme');
        }
    }
    return isDark ? 'dark' : 'light';
}

function togglePrivacyMask(editorEl, isMasked) {
    if (!editorEl || !editorEl.classList) return false;
    if (typeof isMasked === 'boolean') {
        if (isMasked) {
            editorEl.classList.add('privacy-blur');
        } else {
            editorEl.classList.remove('privacy-blur');
        }
        return isMasked;
    }
    const hasClass = editorEl.classList.contains('privacy-blur');
    if (hasClass) {
        editorEl.classList.remove('privacy-blur');
        return false;
    } else {
        editorEl.classList.add('privacy-blur');
        return true;
    }
}

// ==========================================
// Client-side Application Controller
// ==========================================

if (typeof document !== 'undefined') {
    (function () {
        const instanceId = 'win-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        let currentState = null;
        let currentTheme = 'light';
        let isPrivacyMaskActive = false;
        let currentMode = 'tab';
        let isEditingTabTitle = false;

        let tabStrip = null;
        let addTabBtn = null;
        let modeSwitchBtn = null;
        let privacyBtn = null;
        let copyAllBtn = null;
        let themeToggleBtn = null;
        let noteTextarea = null;
        let saveStatusEl = null;
        let wordCountEl = null;
        let charCountEl = null;

        const debouncedSaver = createDebouncedSaver(async (stateToSave) => {
            await persistState(stateToSave);
            setSaveStatus('saved');
        }, 300);

        function setSaveStatus(status) {
            if (!saveStatusEl) return;
            if (status === 'saving') {
                saveStatusEl.textContent = 'Đang lưu...';
                saveStatusEl.className = 'save-status saving';
            } else if (status === 'saved') {
                saveStatusEl.textContent = 'Đã lưu ✔';
                saveStatusEl.className = 'save-status saved';
            }
        }

        function updateCounts(text) {
            const { words, chars } = calculateWordAndCharCount(text);
            if (wordCountEl) wordCountEl.textContent = `${words} từ`;
            if (charCountEl) charCountEl.textContent = `${chars} ký tự`;
        }

        async function persistState(stateToSave) {
            if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                return;
            }
            const payload = {
                ...stateToSave,
                theme: currentTheme,
                privacyMask: isPrivacyMaskActive,
                _lastSavedBy: instanceId
            };
            return new Promise((resolve) => {
                chrome.storage.local.set({ NotepadTabs: payload }, () => resolve());
            });
        }

        function syncActiveTabToEditor() {
            if (!currentState || !noteTextarea) return;
            const activeTab = currentState.tabs.find(t => t.id === currentState.activeTabId) || currentState.tabs[0];
            if (activeTab) {
                noteTextarea.value = activeTab.content || '';
                updateCounts(activeTab.content || '');
            }
        }

        function renderTabs() {
            if (!tabStrip || !currentState) return;
            tabStrip.innerHTML = '';

            currentState.tabs.forEach((tab) => {
                const isActive = tab.id === currentState.activeTabId;
                const tabEl = document.createElement('div');
                tabEl.className = `tab-item${isActive ? ' active' : ''}`;
                tabEl.setAttribute('role', 'tab');
                tabEl.setAttribute('aria-selected', isActive ? 'true' : 'false');
                tabEl.setAttribute('data-tab-id', tab.id);

                const titleSpan = document.createElement('span');
                titleSpan.className = 'tab-title';
                titleSpan.textContent = tab.title || 'Ghi chú';
                titleSpan.title = tab.title || 'Ghi chú';
                tabEl.appendChild(titleSpan);

                // Render close button only if there are > 1 tabs
                if (currentState.tabs.length > 1) {
                    const closeBtn = document.createElement('button');
                    closeBtn.className = 'tab-close-btn';
                    closeBtn.textContent = '×';
                    closeBtn.title = 'Đóng tab';
                    closeBtn.setAttribute('aria-label', 'Đóng tab');
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                    });
                    tabEl.appendChild(closeBtn);
                }

                // Tab selection on click
                tabEl.addEventListener('click', () => {
                    if (isEditingTabTitle) return;
                    if (tab.id !== currentState.activeTabId) {
                        switchTab(tab.id);
                    }
                });

                // Tab renaming on double click
                titleSpan.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    startRenameTab(tab.id, titleSpan);
                });

                tabStrip.appendChild(tabEl);
            });

            const activeEl = tabStrip.querySelector('.tab-item.active');
            if (activeEl && typeof activeEl.scrollIntoView === 'function') {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }

        async function switchTab(newTabId) {
            if (debouncedSaver.isPending()) {
                await debouncedSaver.flush();
            } else if (noteTextarea) {
                currentState = updateTabContent(currentState, currentState.activeTabId, noteTextarea.value);
            }
            currentState = selectTab(currentState, newTabId);
            await persistState(currentState);
            renderTabs();
            syncActiveTabToEditor();
            if (noteTextarea) noteTextarea.focus();
        }

        async function addNewTab() {
            if (debouncedSaver.isPending()) {
                await debouncedSaver.flush();
            } else if (noteTextarea) {
                currentState = updateTabContent(currentState, currentState.activeTabId, noteTextarea.value);
            }
            currentState = addTab(currentState);
            await persistState(currentState);
            renderTabs();
            syncActiveTabToEditor();
            if (noteTextarea) noteTextarea.focus();
        }

        async function closeTab(tabId) {
            if (debouncedSaver.isPending()) {
                await debouncedSaver.flush();
            }
            currentState = removeTab(currentState, tabId);
            await persistState(currentState);
            renderTabs();
            syncActiveTabToEditor();
            if (noteTextarea) noteTextarea.focus();
        }

        function startRenameTab(tabId, titleSpan) {
            isEditingTabTitle = true;
            const currentTitle = titleSpan.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'tab-rename-input';
            input.value = currentTitle;

            async function finishRename() {
                if (!isEditingTabTitle) return;
                isEditingTabTitle = false;
                if (debouncedSaver.isPending()) {
                    await debouncedSaver.flush();
                }
                const newTitle = input.value.trim() || 'Ghi chú';
                currentState = renameTab(currentState, tabId, newTitle);
                await persistState(currentState);
                renderTabs();
            }

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    finishRename();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    isEditingTabTitle = false;
                    renderTabs();
                }
            });

            input.addEventListener('blur', () => {
                finishRename();
            });

            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            titleSpan.replaceWith(input);
            input.focus();
            input.select();
        }

        function onTextareaInput() {
            if (!noteTextarea) return;
            const text = noteTextarea.value;
            updateCounts(text);
            setSaveStatus('saving');
            currentState = updateTabContent(currentState, currentState.activeTabId, text);
            debouncedSaver.trigger(currentState);
        }

        function updateModeSwitchButton(mode) {
            if (!modeSwitchBtn) return;
            if (mode === 'window') {
                modeSwitchBtn.textContent = '🗖';
                modeSwitchBtn.title = 'Mở dạng Tab trình duyệt 🗖';
                modeSwitchBtn.setAttribute('aria-label', 'Mở dạng Tab trình duyệt');
            } else {
                modeSwitchBtn.textContent = '🗗';
                modeSwitchBtn.title = 'Tách thành cửa sổ riêng 🗗';
                modeSwitchBtn.setAttribute('aria-label', 'Tách thành cửa sổ riêng');
            }
        }

        async function onModeSwitchClick() {
            if (debouncedSaver.isPending()) {
                await debouncedSaver.flush();
            } else if (noteTextarea) {
                currentState = updateTabContent(currentState, currentState.activeTabId, noteTextarea.value);
                await persistState(currentState);
            }

            if (typeof chrome === 'undefined') return;
            const noteUrl = chrome.runtime.getURL("note/note.html");

            if (currentMode === 'tab') {
                if (chrome.windows && chrome.windows.create) {
                    chrome.windows.create({
                        url: noteUrl,
                        type: 'popup',
                        width: 520,
                        height: 640
                    }, () => {
                        window.close();
                    });
                }
            } else {
                if (chrome.tabs && chrome.tabs.create) {
                    chrome.tabs.create({ url: noteUrl }, () => {
                        window.close();
                    });
                }
            }
        }

        function onPrivacyClick() {
            isPrivacyMaskActive = togglePrivacyMask(noteTextarea);
            if (privacyBtn) {
                privacyBtn.classList.toggle('active', isPrivacyMaskActive);
                privacyBtn.title = isPrivacyMaskActive ? 'Tắt che mờ riêng tư' : 'Bật/Tắt che mờ riêng tư';
            }
            persistState(currentState);
        }

        function onThemeToggleClick() {
            currentTheme = (currentTheme === 'dark') ? 'light' : 'dark';
            applyTheme(currentTheme, document);
            if (themeToggleBtn) {
                themeToggleBtn.title = currentTheme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối';
            }
            persistState(currentState);
        }

        async function onCopyAllClick() {
            const textToCopy = noteTextarea ? noteTextarea.value : '';
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(textToCopy);
                } else if (noteTextarea) {
                    noteTextarea.select();
                    document.execCommand('copy');
                }
                if (copyAllBtn) {
                    const originalIcon = copyAllBtn.textContent;
                    copyAllBtn.textContent = '✔';
                    copyAllBtn.title = 'Đã sao chép!';
                    setTimeout(() => {
                        copyAllBtn.textContent = originalIcon;
                        copyAllBtn.title = 'Sao chép toàn bộ ghi chú';
                    }, 1500);
                }
            } catch (err) {
                console.error('Failed to copy note text: ', err);
            }
        }

        async function initApp() {
            tabStrip = document.getElementById('tabStrip');
            addTabBtn = document.getElementById('addTabBtn');
            modeSwitchBtn = document.getElementById('modeSwitchBtn');
            privacyBtn = document.getElementById('privacyBtn');
            copyAllBtn = document.getElementById('copyAllBtn');
            themeToggleBtn = document.getElementById('themeToggleBtn');
            noteTextarea = document.getElementById('noteTextarea');
            saveStatusEl = document.getElementById('saveStatus');
            wordCountEl = document.getElementById('wordCount');
            charCountEl = document.getElementById('charCount');

            // 1. Detect Dual-Mode
            if (typeof chrome !== 'undefined' && chrome.windows && chrome.windows.getCurrent) {
                chrome.windows.getCurrent((win) => {
                    currentMode = detectWindowMode(win);
                    updateModeSwitchButton(currentMode);
                });
            }

            // 2. Load storage data & migrate legacy if needed
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['NotepadTabs', 'Notes', 'theme', 'privacyMask'], (data) => {
                    let loadedState = null;
                    if (data && data.NotepadTabs && Array.isArray(data.NotepadTabs.tabs) && data.NotepadTabs.tabs.length > 0) {
                        loadedState = data.NotepadTabs;
                    } else if (data && data.Notes && Array.isArray(data.Notes) && data.Notes.length > 0) {
                        loadedState = migrateLegacyNotes(data.Notes);
                    } else {
                        loadedState = createInitialState();
                    }

                    const loadedTheme = (data && data.NotepadTabs && data.NotepadTabs.theme) || (data && data.theme) || 'light';
                    const loadedPrivacy = (data && data.NotepadTabs && data.NotepadTabs.privacyMask !== undefined)
                        ? data.NotepadTabs.privacyMask
                        : Boolean(data && data.privacyMask);

                    currentTheme = loadedTheme;
                    isPrivacyMaskActive = loadedPrivacy;
                    currentState = {
                        ...loadedState,
                        theme: currentTheme,
                        privacyMask: isPrivacyMaskActive
                    };

                    // Persist if migrated or fresh
                    if (!data || !data.NotepadTabs) {
                        chrome.storage.local.set({ NotepadTabs: currentState });
                    }

                    applyTheme(currentTheme, document);
                    if (noteTextarea) {
                        togglePrivacyMask(noteTextarea, isPrivacyMaskActive);
                    }
                    if (privacyBtn) {
                        privacyBtn.classList.toggle('active', isPrivacyMaskActive);
                        privacyBtn.title = isPrivacyMaskActive ? 'Tắt che mờ riêng tư' : 'Bật/Tắt che mờ riêng tư';
                    }
                    if (themeToggleBtn) {
                        themeToggleBtn.title = currentTheme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối';
                    }

                    renderTabs();
                    syncActiveTabToEditor();
                });
            } else {
                currentState = createInitialState();
                renderTabs();
                syncActiveTabToEditor();
            }

            // 3. Attach Event Listeners
            if (addTabBtn) {
                addTabBtn.addEventListener('click', addNewTab);
            }

            if (modeSwitchBtn) {
                modeSwitchBtn.addEventListener('click', onModeSwitchClick);
            }

            if (privacyBtn) {
                privacyBtn.addEventListener('click', onPrivacyClick);
            }

            if (themeToggleBtn) {
                themeToggleBtn.addEventListener('click', onThemeToggleClick);
            }

            if (copyAllBtn) {
                copyAllBtn.addEventListener('click', onCopyAllClick);
            }

            if (noteTextarea) {
                noteTextarea.addEventListener('input', onTextareaInput);

                // Tab key indentation (insert 2 spaces instead of losing focus)
                noteTextarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        handleTabKeyIndentation(noteTextarea);
                        onTextareaInput();
                    }
                });
            }

            // 4. Cross-window Real-time Sync
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
                chrome.storage.onChanged.addListener((changes, areaName) => {
                    if (areaName === 'local' && changes.NotepadTabs) {
                        const newTabsData = changes.NotepadTabs.newValue;
                        if (!newTabsData || !Array.isArray(newTabsData.tabs)) return;

                        // Local save event guard: skip if this window initiated the save
                        if (newTabsData._lastSavedBy === instanceId) return;

                        // Immediately sync theme and privacy mask across windows even if textarea is focused
                        if (newTabsData.theme && newTabsData.theme !== currentTheme) {
                            currentTheme = newTabsData.theme;
                            applyTheme(currentTheme, document);
                            if (themeToggleBtn) {
                                themeToggleBtn.title = currentTheme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối';
                            }
                        }
                        if (newTabsData.privacyMask !== undefined && newTabsData.privacyMask !== isPrivacyMaskActive) {
                            isPrivacyMaskActive = newTabsData.privacyMask;
                            if (noteTextarea) togglePrivacyMask(noteTextarea, isPrivacyMaskActive);
                            if (privacyBtn) {
                                privacyBtn.classList.toggle('active', isPrivacyMaskActive);
                                privacyBtn.title = isPrivacyMaskActive ? 'Tắt che mờ riêng tư' : 'Bật/Tắt che mờ riêng tư';
                            }
                        }

                        // Tab content & active tab sync based on focus
                        const isFocused = (document.activeElement === noteTextarea);
                        if (!isFocused) {
                            currentState = newTabsData;
                            renderTabs();
                            syncActiveTabToEditor();
                        } else {
                            const activeId = currentState ? currentState.activeTabId : newTabsData.activeTabId;
                            currentState = {
                                ...newTabsData,
                                activeTabId: activeId
                            };
                            renderTabs();
                        }
                    }
                });
            }

            // 5. Window beforeunload flush
            window.addEventListener('beforeunload', () => {
                if (debouncedSaver && debouncedSaver.isPending()) {
                    debouncedSaver.flush();
                }
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initApp);
        } else {
            initApp();
        }
    })();
}

// ==========================================
// Exports for Global Browser & Node.js Test
// ==========================================

if (typeof window !== 'undefined') {
    window.createInitialState = createInitialState;
    window.addTab = addTab;
    window.removeTab = removeTab;
    window.renameTab = renameTab;
    window.updateTabContent = updateTabContent;
    window.selectTab = selectTab;
    window.calculateWordAndCharCount = calculateWordAndCharCount;
    window.migrateLegacyNotes = migrateLegacyNotes;
    window.detectWindowMode = detectWindowMode;
    window.handleTabKeyIndentation = handleTabKeyIndentation;
    window.createDebouncedSaver = createDebouncedSaver;
    window.applyTheme = applyTheme;
    window.togglePrivacyMask = togglePrivacyMask;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createInitialState,
        addTab,
        removeTab,
        renameTab,
        updateTabContent,
        selectTab,
        calculateWordAndCharCount,
        migrateLegacyNotes,
        detectWindowMode,
        handleTabKeyIndentation,
        createDebouncedSaver,
        applyTheme,
        togglePrivacyMask
    };
}
