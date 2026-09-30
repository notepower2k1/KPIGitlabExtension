// --- GitLab Issue Summary Modal Core Logic ---

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function roundToOneDecimal(val) {
    return Math.round((Number(val || 0) + Number.EPSILON) * 10) / 10;
}

function calculateChildTaskMetrics(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
        return {
            totalTasks: 0,
            totalEstimate: 0,
            totalSpent: 0,
            diffHours: 0,
            openTasks: 0,
            closedTasks: 0,
            lateTasks: 0,
            onTimeRate: 100,
            plannedCount: 0,
            unplannedCount: 0
        };
    }

    let sumEstimate = 0;
    let sumSpent = 0;
    let openTasks = 0;
    let closedTasks = 0;
    let lateTasks = 0;
    let plannedCount = 0;
    let unplannedCount = 0;

    tasks.forEach(task => {
        if (!task) return;
        const est = parseFloat(task.estimateHour) || 0;
        const spent = parseFloat(task.spentHour) || 0;

        sumEstimate += est;
        sumSpent += spent;

        const state = (task.state || '').toLowerCase();
        if (state === 'opened') {
            openTasks++;
        } else if (state === 'closed') {
            closedTasks++;
        }

        if (Boolean(task.isLate)) {
            lateTasks++;
        }

        if (task.isUnplanned) {
            unplannedCount++;
        } else {
            plannedCount++;
        }
    });

    const totalEstimate = roundToOneDecimal(sumEstimate);
    const totalSpent = roundToOneDecimal(sumSpent);
    const diffHours = roundToOneDecimal(totalEstimate - totalSpent);
    const onTimeRate = closedTasks > 0
        ? Math.max(0, Math.round(((closedTasks - lateTasks) / closedTasks) * 100))
        : 100;

    return {
        totalTasks: tasks.length,
        totalEstimate,
        totalSpent,
        diffHours,
        openTasks,
        closedTasks,
        lateTasks,
        onTimeRate,
        plannedCount,
        unplannedCount
    };
}

function filterMyChildTasks(items, userProfileUrl) {
    if (!Array.isArray(items)) return [];
    if (!userProfileUrl) return [...items];
    return items.filter(item => item && item.assigneeUrl === userProfileUrl);
}

function renderSummaryModalHtml(metrics, tasks = [], parentTitle = '') {
    const safeParentTitle = escapeHtml(parentTitle);
    const safeMetrics = metrics || calculateChildTaskMetrics([]);
    const diffSign = safeMetrics.diffHours > 0 ? `+${safeMetrics.diffHours}h` : `${safeMetrics.diffHours}h`;
    const diffColorClass = safeMetrics.diffHours >= 0 ? 'gl-text-success' : 'gl-text-danger';
    const onTimeColorClass = safeMetrics.onTimeRate >= 80 ? 'gl-text-success' : (safeMetrics.onTimeRate >= 50 ? 'gl-text-warning' : 'gl-text-danger');

    let tableRowsHtml = '';
    if (!tasks || tasks.length === 0) {
        tableRowsHtml = `
            <tr>
                <td colspan="7" class="gl-kpi-empty-cell" style="text-align: center; padding: 24px; color: #666;">
                    Không tìm thấy task con nào thuộc về bạn trên trang này.
                </td>
            </tr>`;
    } else {
        tableRowsHtml = tasks.map(task => {
            const title = escapeHtml(task.title || (task.id ? `Task #${task.id}` : 'Không có tiêu đề'));
            const href = escapeHtml(task.href || '#');
            const est = (task.estimateHour !== undefined && task.estimateHour !== null) ? `${task.estimateHour}h` : '-';
            const spent = (task.spentHour !== undefined && task.spentHour !== null) ? `${task.spentHour}h` : '-';

            let diffText = '-';
            let diffClass = '';
            if (task.diffHour !== undefined && task.diffHour !== null) {
                const diffVal = Number(task.diffHour);
                diffText = diffVal > 0 ? `+${diffVal}h` : `${diffVal}h`;
                diffClass = diffVal >= 0 ? 'gl-text-success' : 'gl-text-danger';
            } else if (task.estimateHour !== undefined && task.spentHour !== undefined) {
                const diffVal = roundToOneDecimal(Number(task.estimateHour) - Number(task.spentHour));
                diffText = diffVal > 0 ? `+${diffVal}h` : `${diffVal}h`;
                diffClass = diffVal >= 0 ? 'gl-text-success' : 'gl-text-danger';
            }

            const state = (task.state || '').toLowerCase();
            const stateBadge = state === 'closed'
                ? '<span class="gl-badge gl-badge-closed">Đã đóng</span>'
                : '<span class="gl-badge gl-badge-opened">Đang mở</span>';

            const timelinessBadge = task.isLate
                ? '<span class="gl-badge gl-badge-danger">Trễ hạn</span>'
                : '<span class="gl-badge gl-badge-success">Đúng hạn</span>';

            const planBadge = task.isUnplanned
                ? '<span class="gl-badge gl-badge-warning">Phát sinh</span>'
                : '<span class="gl-badge gl-badge-info">Kế hoạch</span>';

            return `
                <tr>
                    <td class="gl-kpi-task-title">
                        <a href="${href}" target="_blank" rel="noopener noreferrer">${title}</a>
                    </td>
                    <td class="gl-kpi-num">${est}</td>
                    <td class="gl-kpi-num">${spent}</td>
                    <td class="gl-kpi-num ${diffClass}">${diffText}</td>
                    <td class="gl-kpi-status">${stateBadge}</td>
                    <td class="gl-kpi-status">${timelinessBadge}</td>
                    <td class="gl-kpi-status">${planBadge}</td>
                </tr>`;
        }).join('');
    }

    return `
<div id="gitlabKpiSummaryModal" class="gl-kpi-modal-overlay">
    <div class="gl-kpi-modal-dialog">
        <div class="gl-kpi-modal-header">
            <div>
                <h3 class="gl-kpi-modal-title">📊 Tổng hợp Task con của tôi</h3>
                ${safeParentTitle ? `<div class="gl-kpi-modal-subtitle">${safeParentTitle}</div>` : ''}
            </div>
            <div class="gl-kpi-header-actions">
                <button id="glKpiAddAllBtn" class="btn btn-sm btn-success gl-button">➕ Thêm tất cả vào KPI</button>
                <button id="glKpiRefreshBtn" class="btn btn-sm btn-default gl-button">🔄 Làm mới</button>
                <span id="glKpiCloseBtn" class="gl-kpi-close-icon" title="Đóng">&times;</span>
            </div>
        </div>
        <div class="gl-kpi-modal-body">
            <!-- Summary Metric Cards -->
            <div class="gl-kpi-summary-grid">
                <div class="gl-kpi-card">
                    <div class="gl-kpi-card-title">Tổng Task</div>
                    <div class="gl-kpi-card-value">${safeMetrics.totalTasks}</div>
                    <div class="gl-kpi-card-sub">
                        <span class="gl-badge gl-badge-closed">${safeMetrics.closedTasks} đóng</span>
                        <span class="gl-badge gl-badge-opened">${safeMetrics.openTasks} mở</span>
                    </div>
                </div>
                <div class="gl-kpi-card">
                    <div class="gl-kpi-card-title">Tổng Estimate</div>
                    <div class="gl-kpi-card-value">${safeMetrics.totalEstimate}h</div>
                    <div class="gl-kpi-card-sub">${safeMetrics.plannedCount} kế hoạch</div>
                </div>
                <div class="gl-kpi-card">
                    <div class="gl-kpi-card-title">Tổng Spent</div>
                    <div class="gl-kpi-card-value">${safeMetrics.totalSpent}h</div>
                    <div class="gl-kpi-card-sub">${safeMetrics.unplannedCount} phát sinh</div>
                </div>
                <div class="gl-kpi-card">
                    <div class="gl-kpi-card-title">Chênh lệch</div>
                    <div class="gl-kpi-card-value ${diffColorClass}">${diffSign}</div>
                    <div class="gl-kpi-card-sub">${safeMetrics.diffHours >= 0 ? 'Dư thời gian' : 'Vượt Estimate'}</div>
                </div>
                <div class="gl-kpi-card">
                    <div class="gl-kpi-card-title">Đúng hạn</div>
                    <div class="gl-kpi-card-value ${onTimeColorClass}">${safeMetrics.onTimeRate}%</div>
                    <div class="gl-kpi-card-sub">${safeMetrics.lateTasks > 0 ? `${safeMetrics.lateTasks} task trễ` : '100% đúng hạn'}</div>
                </div>
            </div>
            <!-- Detailed Task Table -->
            <div class="gl-kpi-table-wrapper">
                <table class="gl-kpi-table">
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Estimate</th>
                            <th>Spent</th>
                            <th>Chênh lệch</th>
                            <th>Trạng thái</th>
                            <th>Tiến độ</th>
                            <th>Phân loại</th>
                        </tr>
                    </thead>
                    <tbody id="glKpiTableBody">
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>`.trim();
}

// --- Browser Content Script Initialization ---
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.calculateChildTaskMetrics = calculateChildTaskMetrics;
    window.filterMyChildTasks = filterMyChildTasks;
    window.renderSummaryModalHtml = renderSummaryModalHtml;

    (async () => {
        console.log('Loading content_issue.js');

        let loadingSuccess = false;
        const WORK_ITEM_KEY = 'WorkItemIds';
        const addedLinks = new Set();
        const svgAdd = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="green" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            `;

        const svgRemove = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="red" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            `;

        // Sử dụng hàm từ utils.js
        const storedItems = await getStoredIds(WORK_ITEM_KEY);
        storedItems.forEach(item => addedLinks.add(item.id));
        const userProfile = await getUserProfile();

        function getParentIssueInfo() {
            const pageUrl = (window.location.origin + window.location.pathname).replace(/\/+$/, '');
            const issueIidMatch = pageUrl.match(/\/issues\/(\d+)/);
            const parentIid = issueIidMatch ? issueIidMatch[1] : '';
            const parentUrl = issueIidMatch ? pageUrl : '';
            const titleEl = document.querySelector('h1.title, [data-testid="issue-title"], .issue-details .title');
            let parentTitle = titleEl ? titleEl.innerText.trim() : '';
            if (!parentTitle && document.title) {
                parentTitle = document.title.replace(/\s*·.*$/, '').trim();
            }
            if (parentIid && !parentTitle) {
                parentTitle = `Issue #${parentIid}`;
            }
            return { parentTitle, parentUrl, parentIid };
        }

        function createAddButton(workItemId, href, taskTitle = '') {
            const button = document.createElement('button');
            button.className = 'btn btn-default btn-sm gl-button';

            const updateButtonAppearance = () => {
                if (addedLinks.has(workItemId)) {
                    button.innerHTML = svgRemove;
                    button.classList.remove('btn-success');
                    button.classList.add('btn-danger');
                } else {
                    button.innerHTML = svgAdd;
                    button.classList.remove('btn-danger');
                    button.classList.add('btn-success');
                }
            };

            updateButtonAppearance();

            button.addEventListener('click', async (e) => {
                e.stopPropagation(); // chặn sự kiện lan lên DOM gốc
                e.preventDefault();  // tránh hành vi mặc định
                // Ngăn spam nút bằng cách vô hiệu hóa nó ngay khi nhấn
                button.disabled = true;

                try {
                    // Get group name
                    if (addedLinks.has(workItemId)) {
                        await removeIdFromStorage(WORK_ITEM_KEY, workItemId);
                        addedLinks.delete(workItemId);
                    } else {
                        const today = new Date().toLocaleString();
                        const parentInfo = getParentIssueInfo();
                        await addIdToStorage(WORK_ITEM_KEY, workItemId, href, today, {
                            parentTitle: parentInfo.parentTitle,
                            parentUrl: parentInfo.parentUrl,
                            parentIid: parentInfo.parentIid,
                            taskTitle: taskTitle
                        });
                        addedLinks.add(workItemId);
                    }
                } catch (error) {
                    console.error('Error handling button click:', error);
                } finally {
                    // Cho phép người dùng nhấn lại sau khi xử lý xong
                    button.disabled = false;
                }

                updateButtonAppearance();
            });

            return button;
        }

        function createRefreshButton() {
            const taskHeader = document.querySelector('#tasks > .crud-header');

            // Tạo nút
            const button = document.createElement('button');
            button.className = 'btn btn-sm btn-default gl-button';
            button.title = 'Refresh';
            button.style.display = 'flex';
            button.style.alignItems = 'center';

            button.style.justifyContent = 'center';
            // SVG icon (biểu tượng refresh)
            button.innerHTML = `
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                viewBox="0 0 32 32" enable-background="new 0 0 32 32" xml:space="preserve">
            <path fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" d="M25.7,10.9C23.9,7.4,20.2,5,16,5
                c-4.7,0-8.6,2.9-10.2,7"/>
            <path fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" d="M6.2,21c1.8,3.5,5.5,6,9.8,6c4.7,0,8.6-2.9,10.2-7"
                />
            <polyline fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" points="26,5 26,11 20,11 "/>
            <polyline fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" points="6,27 6,21 12,21 "/>
            </svg>
        `;

            // Gán sự kiện click
            button.addEventListener('click', () => {
                processTasks();
            });

            // Gắn nút vào header (nếu chưa có)
            if (!taskHeader.querySelector('button[title="Refresh"]')) {
                taskHeader.append(button);
            }
        }

        function processTasks() {
            // Handle for issue
            const taskSection = document.querySelector('#tasks > .crud-body');
            if (!taskSection) return;

            const taskItems = taskSection.querySelectorAll('ul[data-testid="child-items-container"] > li.tree-item');
            const parentInfo = getParentIssueInfo();
            const currentTasks = new Map();

            taskItems.forEach(li => {
                const container = li.querySelector('div[data-testid="links-child"]');
                const workItemId = container?.getAttribute('parent-work-item-id');
                const anchor = li.querySelector('a');

                if (!workItemId || !anchor) return;

                const avatarUrl = li.querySelector('div.gl-avatars-inline-child > a')?.getAttribute('href');

                if (userProfile && avatarUrl != userProfile.web_url) return;

                const taskTitle = anchor.innerText?.trim() || anchor.title?.trim() || '';
                currentTasks.set(workItemId, { href: anchor.href, title: taskTitle });

                const position = li.querySelector('div[data-testid="child-contents-container"] > div[data-testid="links-child"]');

                // Kiểm tra nếu đã có nút thì bỏ qua
                if (position.querySelector('.custom-add-button')) return;

                const addButton = createAddButton(workItemId, anchor.href, taskTitle);
                addButton.classList.add('custom-add-button'); // Gắn class để kiểm tra sau này

                position.prepend(addButton);
            });

            // Tự động bổ sung thông tin Issue cha cho các task đang mở trên trang này nếu trước đó chưa có
            if (currentTasks.size > 0 && parentInfo.parentTitle) {
                backfillParentInfo(currentTasks, parentInfo);
            }
        }

        // Bắt đầu quan sát từ phần tử gốc (ví dụ: body)
        const observer = new MutationObserver((mutations, obs) => {
            const targetElement = document.querySelector("ul[data-testid='child-items-container']");

            if (targetElement) {
                processTasks();
                createRefreshButton();
                obs.disconnect(); // Ngừng quan sát sau khi phát hiện
            }
        });

        // Cấu hình observer
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        async function backfillParentInfo(currentTasks, parentInfo) {
            try {
                const items = await getStoredIds(WORK_ITEM_KEY);
                let updated = false;
                items.forEach(item => {
                    if (currentTasks.has(item.id)) {
                        const taskMeta = currentTasks.get(item.id);
                        if (!item.parentTitle || !item.parentUrl) {
                            item.parentTitle = item.parentTitle || parentInfo.parentTitle;
                            item.parentUrl = item.parentUrl || parentInfo.parentUrl;
                            item.parentIid = item.parentIid || parentInfo.parentIid;
                            if (!item.taskTitle && taskMeta.title) item.taskTitle = taskMeta.title;
                            updated = true;
                        }
                    }
                });
                if (updated) {
                    await chrome.storage.local.set({ [WORK_ITEM_KEY]: items });
                }
            } catch (err) {
                console.error('Error backfilling parent info:', err);
            }
        }

        async function addIdToStorage(key, id, href, createAt, extra = {}) {
            const items = await getStoredIds(key);
            const existingIdx = items.findIndex(item => item.id === id);
            if (existingIdx === -1) {
                items.push({ id, href, createAt, ...extra });
            } else {
                items[existingIdx] = { ...items[existingIdx], ...extra };
            }
            await chrome.storage.local.set({ [key]: items });
        }

    })();
}

// --- Module Exports for Testing ---
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        roundToOneDecimal,
        calculateChildTaskMetrics,
        filterMyChildTasks,
        renderSummaryModalHtml
    };
}
