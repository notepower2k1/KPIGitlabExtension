if (typeof document !== 'undefined') {
(async () => {
    const STORAGE_KEY = 'Notes';
    let pastedImageData = null;
    let selectedColor = '#ffffff';
    let currentEditingId = null;

    // Initialization
    await displayNotes();

    // Event Listeners for Composer
    document.getElementById("addBtn").addEventListener("click", async () => {
        const input = document.getElementById("noteInput");
        const imageInput = document.getElementById("imageInput");
        const text = input.value.trim();

        let imageBase64 = pastedImageData;

        if (!imageBase64 && imageInput.files.length > 0) {
            imageBase64 = await convertToBase64(imageInput.files[0]);
        }

        if (!text && !imageBase64) return;

        const note = {
            id: Date.now(),
            text: text,
            timestamp: new Date().toISOString(),
            image: imageBase64,
            color: selectedColor
        };

        await saveNote(STORAGE_KEY, note);

        // Reset state
        input.value = "";
        imageInput.value = "";
        pastedImageData = null;
        selectedColor = '#ffffff';
        document.getElementById("imagePreview").innerHTML = "";
        resetColorDots();

        displayNotes();
    });

    // Color Picker logic
    document.querySelectorAll(".color-dot").forEach(dot => {
        dot.addEventListener("click", () => {
            selectedColor = dot.dataset.color;
            resetColorDots();
            dot.classList.add("active");
            document.querySelector(".composer-card").style.backgroundColor = selectedColor;
        });
    });

    function resetColorDots() {
        document.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
        document.querySelectorAll(".color-dot")[0].classList.add("active");
        document.querySelector(".composer-card").style.backgroundColor = "#ffffff";
    }

    // List rendering
    async function displayNotes(searchTerm = "") {
        const container = document.getElementById("notesContainer");
        const notes = await getStoredIds(STORAGE_KEY);

        // Sort notes (newest first)
        notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const filteredNotes = searchTerm
            ? notes.filter(n => n.text.toLowerCase().includes(searchTerm.toLowerCase()))
            : notes;

        document.getElementById("total-notes-count").textContent = `${notes.length} ghi chú đã lưu`;

        container.innerHTML = "";

        filteredNotes.forEach(note => {
            const card = document.createElement("div");
            card.className = "note-card";
            card.style.backgroundColor = note.color || '#ffffff';

            const date = new Date(note.timestamp);
            const formattedTime = date.toLocaleString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            card.innerHTML = `
                <div class="note-text">${linkify(note.text)}</div>
                ${note.image ? `<img src="${note.image}" class="note-image" />` : ''}
                <div class="note-footer">
                    <span class="note-time">${formattedTime}</span>
                    <div class="note-actions">
                        <button class="action-btn edit" data-id="${note.id}" title="Sửa">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="action-btn delete" data-id="${note.id}" title="Xóa">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        attachActionEvents();
    }

    function attachActionEvents() {
        // Delete
        document.querySelectorAll(".action-btn.delete").forEach(btn => {
            btn.onclick = async (e) => {
                const id = parseInt(btn.dataset.id);
                if (confirm("Xóa ghi chú này?")) {
                    await deleteNoteById(STORAGE_KEY, id);
                    displayNotes(document.getElementById("searchInput").value);
                }
            };
        });

        // Edit
        document.querySelectorAll(".action-btn.edit").forEach(btn => {
            btn.onclick = async () => {
                const id = parseInt(btn.dataset.id);
                const notes = await getStoredIds(STORAGE_KEY);
                const note = notes.find(n => n.id === id);
                if (note) {
                    currentEditingId = id;
                    document.getElementById("editNoteInput").value = note.text;
                    document.getElementById("editImagePreview").innerHTML = note.image ? `<img src="${note.image}" style="max-width:100%;" />` : "";
                    document.getElementById("editModal").style.display = "block";
                }
            };
        });
    }

    // Search logic
    document.getElementById("searchInput").addEventListener("input", (e) => {
        displayNotes(e.target.value);
    });

    // Modal Logic
    document.querySelector(".close-modal").onclick = () => {
        document.getElementById("editModal").style.display = "none";
    };

    window.onclick = (event) => {
        const modal = document.getElementById("editModal");
        if (event.target == modal) modal.style.display = "none";
    };

    document.getElementById("saveEditBtn").onclick = async () => {
        const newText = document.getElementById("editNoteInput").value.trim();
        if (currentEditingId) {
            await updateNote(STORAGE_KEY, currentEditingId, newText);
            document.getElementById("editModal").style.display = "none";
            displayNotes(document.getElementById("searchInput").value);
        }
    };

    // Helper functions
    async function saveNote(key, newNote) {
        const notes = await getStoredIds(key);
        notes.push(newNote);
        await chrome.storage.local.set({ [key]: notes });
    }

    async function updateNote(key, id, newText) {
        const notes = await getStoredIds(key);
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
            notes[index].text = newText;
            notes[index].timestamp = new Date().toISOString(); // Update timestamp on edit
            await chrome.storage.local.set({ [key]: notes });
        }
    }

    async function deleteNoteById(key, id) {
        let notes = await getStoredIds(key);
        notes = notes.filter(note => note.id !== id);
        await chrome.storage.local.set({ [key]: notes });
    }

    function convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Paste Handle
    document.getElementById("noteInput").addEventListener("paste", async (event) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf("image") === 0) {
                const file = item.getAsFile();
                pastedImageData = await convertToBase64(file);
                showImagePreview(pastedImageData);
            }
        }
    });

    function showImagePreview(base64) {
        const preview = document.getElementById("imagePreview");
        preview.innerHTML = `<img src="${base64}" />`;
    }

    document.getElementById("clearAllBtn").onclick = async () => {
        if (confirm("Chắc chắn xóa SẠCH ghi chú?")) {
            await chrome.storage.local.remove(STORAGE_KEY);
            displayNotes();
        }
    };

})();
}

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

if (typeof window !== 'undefined') {
    window.createInitialState = createInitialState;
    window.addTab = addTab;
    window.removeTab = removeTab;
    window.renameTab = renameTab;
    window.updateTabContent = updateTabContent;
    window.selectTab = selectTab;
    window.calculateWordAndCharCount = calculateWordAndCharCount;
    window.migrateLegacyNotes = migrateLegacyNotes;
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
        migrateLegacyNotes
    };
}

