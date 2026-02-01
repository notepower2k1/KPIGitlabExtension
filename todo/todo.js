(async () => {
    const STORAGE_KEY = 'todos';

    // Initialize UI elements
    const todoInput = document.getElementById('todo-input');
    const deadlineInput = document.getElementById('deadline-input');
    const reminderBeforeInput = document.getElementById('reminder-before');
    const reminderRepeatInput = document.getElementById('reminder-repeat');

    // Load settings
    const { reminderMinutesBefore = 30, reminderRepeatMinutes = 10 } = await chrome.storage.local.get([
        'reminderMinutesBefore',
        'reminderRepeatMinutes'
    ]);
    reminderBeforeInput.value = reminderMinutesBefore;
    reminderRepeatInput.value = reminderRepeatMinutes;

    // Initial Render
    await renderKanban();

    // --- EVENT LISTENERS ---

    document.getElementById('add-btn').addEventListener('click', handleAddTodo);

    document.getElementById('save-settings').addEventListener('click', async () => {
        const reminderBefore = parseInt(reminderBeforeInput.value) || 30;
        const reminderRepeat = parseInt(reminderRepeatInput.value) || 10;
        await chrome.storage.local.set({
            reminderMinutesBefore: reminderBefore,
            reminderRepeatMinutes: reminderRepeat
        });
        alert("✅ Đã lưu cấu hình nhắc việc!");
    });

    document.getElementById('clear-btn').addEventListener('click', async () => {
        if (confirm("Chắc chắn muốn xóa SẠCH bảng Kanban?")) {
            await chrome.storage.local.remove(STORAGE_KEY);
            renderKanban();
        }
    });

    // --- CORE FUNCTIONS ---

    async function handleAddTodo() {
        const title = todoInput.value.trim();
        const deadline = deadlineInput.value;
        if (!title) return alert("Vui lòng nhập nội dung!");

        const newTodo = {
            id: Date.now().toString(),
            title,
            deadline,
            status: 'todo' // Default status
        };

        const todos = await getStoredIds(STORAGE_KEY);
        todos.push(newTodo);
        await chrome.storage.local.set({ [STORAGE_KEY]: todos });

        todoInput.value = '';
        deadlineInput.value = '';
        renderKanban();
    }

    async function updateTaskStatus(id, newStatus) {
        const todos = await getStoredIds(STORAGE_KEY);
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
            todos[index].status = newStatus;
            await chrome.storage.local.set({ [STORAGE_KEY]: todos });
            renderKanban();
        }
    }

    async function deleteTask(id) {
        const todos = await getStoredIds(STORAGE_KEY);
        const updated = todos.filter(t => t.id !== id);
        await chrome.storage.local.set({ [STORAGE_KEY]: updated });
        renderKanban();
    }

    async function renderKanban() {
        const todos = await getStoredIds(STORAGE_KEY);
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
        Object.values(lists).forEach(list => list.innerHTML = '');

        let counts = { todo: 0, processing: 0, done: 0 };

        todos.forEach(todo => {
            const status = todo.status || 'todo';
            counts[status]++;

            const card = document.createElement('div');
            card.className = 'task-card';

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
                <div class="task-title">${todo.title}</div>
                <div class="task-deadline">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${formattedDeadline}
                </div>
                <div class="task-footer">
                    <div class="task-actions">
                        ${status !== 'todo' ? `<button class="btn-move move-left" data-id="${todo.id}" data-target="${status === 'done' ? 'processing' : 'todo'}">◀ Trở lại</button>` : ''}
                        ${status !== 'done' ? `<button class="btn-move move-right" data-id="${todo.id}" data-target="${status === 'todo' ? 'processing' : 'done'}">Tiến hành ▶</button>` : ''}
                    </div>
                    <button class="btn-delete-task" data-id="${todo.id}" title="Xóa">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;

            lists[status].appendChild(card);
        });

        // Update counts
        Object.keys(counters).forEach(key => counters[key].textContent = counts[key]);
        document.getElementById('total-todo-count').textContent = `${counts.todo + counts.processing} công việc cần hoàn thành`;

        // Attach events to dynamic buttons
        document.querySelectorAll('.btn-move').forEach(btn => {
            btn.onclick = () => updateTaskStatus(btn.dataset.id, btn.dataset.target);
        });
        document.querySelectorAll('.btn-delete-task').forEach(btn => {
            btn.onclick = () => deleteTask(btn.dataset.id);
        });
    }

})();
