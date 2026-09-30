// ==========================================
// Kanban To-Do Pure Data Operations
// ==========================================

function generateTodoId() {
    return Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7);
}

function addTodoItem(todos, title, deadline = '') {
    const list = Array.isArray(todos) ? [...todos] : [];
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (!cleanTitle) return list;

    const newTodo = {
        id: generateTodoId(),
        title: cleanTitle,
        deadline: typeof deadline === 'string' ? deadline : '',
        status: 'todo'
    };
    return [...list, newTodo];
}

function updateTodoItem(todos, id, newTitle, newDeadline) {
    if (!Array.isArray(todos)) return [];
    const hasNewTitle = (typeof newTitle === 'string' && newTitle.trim().length > 0);
    const cleanTitle = hasNewTitle ? newTitle.trim() : null;

    return todos.map(item => {
        if (item.id !== id) return { ...item };
        return {
            ...item,
            title: cleanTitle !== null ? cleanTitle : item.title,
            deadline: newDeadline !== undefined ? newDeadline : item.deadline
        };
    });
}

function changeTodoStatus(todos, id, newStatus) {
    if (!Array.isArray(todos)) return [];
    const VALID_STATUSES = ['todo', 'processing', 'done'];
    if (!VALID_STATUSES.includes(newStatus)) return todos.map(item => ({ ...item }));

    return todos.map(item => {
        if (item.id !== id) return { ...item };
        return {
            ...item,
            status: newStatus
        };
    });
}

function deleteTodoItem(todos, id) {
    if (!Array.isArray(todos)) return [];
    return todos.filter(item => item.id !== id);
}

function resolveTargetStatusFromColumn(targetElement) {
    if (!targetElement) return null;
    if (typeof targetElement === 'string') {
        const lower = targetElement.toLowerCase();
        if (lower.includes('done')) return 'done';
        if (lower.includes('processing')) return 'processing';
        if (lower.includes('todo')) return 'todo';
        return null;
    }

    let el = targetElement;
    if (typeof el.closest === 'function') {
        const colOrList = el.closest('.kanban-column, .task-list');
        if (colOrList) el = colOrList;
    }

    const id = (el.id || '').toLowerCase();
    if (id.includes('done')) return 'done';
    if (id.includes('processing')) return 'processing';
    if (id.includes('todo')) return 'todo';

    if (el.dataset && el.dataset.status) {
        const ds = el.dataset.status.toLowerCase();
        if (['todo', 'processing', 'done'].includes(ds)) return ds;
    }

    const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';
    if (className.includes('done')) return 'done';
    if (className.includes('processing')) return 'processing';
    if (className.includes('todo')) return 'todo';

    return null;
}

// ==========================================
// Client-side Application Controller
// ==========================================

if (typeof document !== 'undefined') {
    (async () => {
        const STORAGE_KEY = 'todos';
        let currentEditingTaskId = null;

        // Initialize UI elements
        const todoInput = document.getElementById('todo-input');
        const deadlineInput = document.getElementById('deadline-input');
        const reminderBeforeInput = document.getElementById('reminder-before');
        const reminderRepeatInput = document.getElementById('reminder-repeat');
        const toggleReminderBtn = document.getElementById('toggleReminderBtn');
        const reminderSettingsPanel = document.getElementById('reminder-settings-panel');

        // Edit modal elements
        const editModal = document.getElementById('editModal');
        const editTaskTitle = document.getElementById('edit-task-title');
        const editTaskDeadline = document.getElementById('edit-task-deadline');
        const saveEditBtn = document.getElementById('save-edit-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        const closeEditBtn = document.getElementById('close-edit-btn');

        // Load settings
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const { reminderMinutesBefore = 30, reminderRepeatMinutes = 10 } = await chrome.storage.local.get([
                'reminderMinutesBefore',
                'reminderRepeatMinutes'
            ]);
            if (reminderBeforeInput) reminderBeforeInput.value = reminderMinutesBefore;
            if (reminderRepeatInput) reminderRepeatInput.value = reminderRepeatMinutes;
        }

        // Initial Render
        await renderKanban();

        // --- EVENT LISTENERS ---

        const addBtn = document.getElementById('add-btn');
        if (addBtn) addBtn.addEventListener('click', handleAddTodo);

        // Enter key in input fields
        if (todoInput) {
            todoInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTodo();
                }
            });
        }

        if (deadlineInput) {
            deadlineInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTodo();
                }
            });
        }

        // Toggle reminder settings
        if (toggleReminderBtn && reminderSettingsPanel) {
            toggleReminderBtn.addEventListener('click', () => {
                const isHidden = reminderSettingsPanel.style.display === 'none' || reminderSettingsPanel.classList.contains('collapsed');
                if (isHidden) {
                    reminderSettingsPanel.style.display = 'flex';
                    reminderSettingsPanel.classList.remove('collapsed');
                    toggleReminderBtn.classList.add('active');
                } else {
                    reminderSettingsPanel.style.display = 'none';
                    reminderSettingsPanel.classList.add('collapsed');
                    toggleReminderBtn.classList.remove('active');
                }
            });
        }

        // Save reminder settings
        const saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', async () => {
                const reminderBefore = parseInt(reminderBeforeInput.value) || 30;
                const reminderRepeat = parseInt(reminderRepeatInput.value) || 10;
                await chrome.storage.local.set({
                    reminderMinutesBefore: reminderBefore,
                    reminderRepeatMinutes: reminderRepeat
                });
                alert("✅ Đã lưu cấu hình nhắc việc!");
            });
        }

        // Clear all
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (confirm("Chắc chắn muốn xóa SẠCH bảng Kanban?")) {
                    await chrome.storage.local.remove(STORAGE_KEY);
                    renderKanban();
                }
            });
        }

        // Edit Modal handlers
        function openEditModal(task) {
            if (!editModal || !task) return;
            currentEditingTaskId = task.id;
            editTaskTitle.value = task.title || '';
            editTaskDeadline.value = task.deadline || '';
            editModal.style.display = 'flex';
            setTimeout(() => {
                if (editTaskTitle) editTaskTitle.focus();
            }, 50);
        }

        function closeEditModal() {
            if (!editModal) return;
            editModal.style.display = 'none';
            currentEditingTaskId = null;
        }

        if (closeEditBtn) closeEditBtn.addEventListener('click', closeEditModal);
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    closeEditModal();
                }
            });
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && editModal && editModal.style.display !== 'none') {
                closeEditModal();
            }
        });

        // Enter key in edit modal inputs to save
        if (editTaskTitle) {
            editTaskTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveEdit();
                }
            });
        }
        if (editTaskDeadline) {
            editTaskDeadline.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveEdit();
                }
            });
        }

        async function handleSaveEdit() {
            if (!currentEditingTaskId) return;
            const newTitle = editTaskTitle.value.trim();
            if (!newTitle) return alert("Vui lòng nhập tên công việc!");

            const newDeadline = editTaskDeadline.value;
            const todos = await getStoredTodos();
            const updated = updateTodoItem(todos, currentEditingTaskId, newTitle, newDeadline);
            await chrome.storage.local.set({ [STORAGE_KEY]: updated });

            closeEditModal();
            renderKanban();
        }

        if (saveEditBtn) saveEditBtn.addEventListener('click', handleSaveEdit);

        // Setup Drag & Drop for Kanban Columns
        const kanbanColumns = document.querySelectorAll('.kanban-column');
        kanbanColumns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'move';
                }
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', (e) => {
                if (e.relatedTarget && column.contains(e.relatedTarget)) {
                    return;
                }
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                document.querySelectorAll('.kanban-column, .task-list').forEach(col => col.classList.remove('drag-over'));

                const taskId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
                if (!taskId) return;

                const targetStatus = resolveTargetStatusFromColumn(column) || resolveTargetStatusFromColumn(e.target);
                if (!targetStatus) return;

                const todos = await getStoredTodos();
                const currentTask = todos.find(t => t.id === taskId);
                if (currentTask && currentTask.status !== targetStatus) {
                    const updated = changeTodoStatus(todos, taskId, targetStatus);
                    await chrome.storage.local.set({ [STORAGE_KEY]: updated });
                    renderKanban();
                }
            });
        });

        // Helper to retrieve todos
        async function getStoredTodos() {
            if (typeof getStoredIds === 'function') {
                return await getStoredIds(STORAGE_KEY);
            }
            return new Promise((resolve) => {
                chrome.storage.local.get([STORAGE_KEY], (res) => resolve(res[STORAGE_KEY] || []));
            });
        }

        // --- CORE FUNCTIONS ---

        async function handleAddTodo() {
            const title = todoInput.value.trim();
            const deadline = deadlineInput.value;
            if (!title) return alert("Vui lòng nhập nội dung!");

            const todos = await getStoredTodos();
            const updated = addTodoItem(todos, title, deadline);
            await chrome.storage.local.set({ [STORAGE_KEY]: updated });

            todoInput.value = '';
            deadlineInput.value = '';
            renderKanban();
        }

        async function updateTaskStatus(id, newStatus) {
            const todos = await getStoredTodos();
            const updated = changeTodoStatus(todos, id, newStatus);
            await chrome.storage.local.set({ [STORAGE_KEY]: updated });
            renderKanban();
        }

        async function deleteTask(id) {
            const todos = await getStoredTodos();
            const updated = deleteTodoItem(todos, id);
            await chrome.storage.local.set({ [STORAGE_KEY]: updated });
            renderKanban();
        }

        async function renderKanban() {
            const todos = await getStoredTodos();
            const lists = {
                todo: document.getElementById('list-todo'),
                processing: document.getElementById('list-processing'),
                done: document.getElementById('list-done')
            };
            const counters = {
                todo: document.getElementById('count-todo'),
                processing: document.getElementById('count-processing'),
                done: document.getElementById('count-done')
            };

            // Clear UI
            Object.values(lists).forEach(list => { if (list) list.innerHTML = ''; });

            let counts = { todo: 0, processing: 0, done: 0 };

            todos.forEach(todo => {
                const status = todo.status || 'todo';
                counts[status]++;

                const card = document.createElement('div');
                card.className = 'task-card';
                card.dataset.id = todo.id;
                card.draggable = true;
                card.setAttribute('draggable', 'true');

                // HTML5 Drag & Drop event handlers for task card
                card.addEventListener('dragstart', (e) => {
                    if (e.dataTransfer) {
                        e.dataTransfer.setData('text/plain', todo.id);
                        e.dataTransfer.effectAllowed = 'move';
                    }
                    setTimeout(() => card.classList.add('is-dragging'), 0);
                });

                card.addEventListener('dragend', () => {
                    document.querySelectorAll('.task-card').forEach(c => c.classList.remove('is-dragging'));
                    document.querySelectorAll('.kanban-column, .task-list').forEach(col => col.classList.remove('drag-over'));
                });

                // Check deadline status
                if (status !== 'done' && todo.deadline) {
                    const deadlineTime = new Date(todo.deadline);
                    const now = new Date();
                    if (deadlineTime < now) {
                        card.classList.add('overdue');
                    } else if (deadlineTime - now <= 2 * 60 * 60 * 1000) {
                        card.classList.add('near-deadline');
                    }
                }

                const formattedDeadline = todo.deadline
                    ? new Date(todo.deadline).toLocaleString('vi-VN', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    })
                    : 'Không có hạn';

                card.innerHTML = `
                    <div class="task-title">${escapeHtml(todo.title)}</div>
                    <div class="task-deadline">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ${formattedDeadline}
                    </div>
                    <div class="task-footer">
                        <div class="task-actions">
                            ${status !== 'todo' ? `<button class="btn-move move-left" data-id="${todo.id}" data-target="${status === 'done' ? 'processing' : 'todo'}">◀ Trở lại</button>` : ''}
                            ${status !== 'done' ? `<button class="btn-move move-right" data-id="${todo.id}" data-target="${status === 'todo' ? 'processing' : 'done'}">Tiến hành ▶</button>` : ''}
                        </div>
                        <div class="task-card-buttons">
                            <button class="btn-edit-task" data-id="${todo.id}" title="Chỉnh sửa">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </button>
                            <button class="btn-delete-task" data-id="${todo.id}" title="Xóa">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                `;

                if (lists[status]) {
                    lists[status].appendChild(card);
                }
            });

            // Update counts
            Object.keys(counters).forEach(key => {
                if (counters[key]) counters[key].textContent = counts[key];
            });
            const totalCountEl = document.getElementById('total-todo-count');
            if (totalCountEl) {
                totalCountEl.textContent = `${counts.todo + counts.processing} công việc cần hoàn thành`;
            }

            // Attach events to dynamic buttons
            document.querySelectorAll('.btn-move').forEach(btn => {
                btn.onclick = () => updateTaskStatus(btn.dataset.id, btn.dataset.target);
            });
            document.querySelectorAll('.btn-edit-task').forEach(btn => {
                btn.onclick = () => {
                    const task = todos.find(t => t.id === btn.dataset.id);
                    if (task) openEditModal(task);
                };
            });
            document.querySelectorAll('.btn-delete-task').forEach(btn => {
                btn.onclick = () => deleteTask(btn.dataset.id);
            });
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    })();
}

// Global browser window bindings
if (typeof window !== 'undefined') {
    window.addTodoItem = addTodoItem;
    window.updateTodoItem = updateTodoItem;
    window.changeTodoStatus = changeTodoStatus;
    window.deleteTodoItem = deleteTodoItem;
    window.resolveTargetStatusFromColumn = resolveTargetStatusFromColumn;
}

// Export for Node unit tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addTodoItem,
        updateTodoItem,
        changeTodoStatus,
        deleteTodoItem,
        resolveTargetStatusFromColumn
    };
}
