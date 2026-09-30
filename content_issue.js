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

    const validTasks = tasks.filter(Boolean);
    if (validTasks.length === 0) {
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
    let lateClosedTasks = 0;
    let plannedCount = 0;
    let unplannedCount = 0;

    validTasks.forEach(task => {
        const est = parseFloat(task.estimateHour) || 0;
        const spent = parseFloat(task.spentHour) || 0;

        sumEstimate += est;
        sumSpent += spent;

        const isLate = Boolean(task.isLate);
        if (isLate) {
            lateTasks++;
        }

        const state = (task.state || '').toLowerCase();
        if (state === 'opened') {
            openTasks++;
        } else if (state === 'closed') {
            closedTasks++;
            if (isLate) {
                lateClosedTasks++;
            }
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
        ? Math.max(0, Math.round(((closedTasks - lateClosedTasks) / closedTasks) * 100))
        : 100;

    return {
        totalTasks: validTasks.length,
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

function resolveTaskIid(task) {
    if (!task) return '';
    if (typeof task === 'string' || typeof task === 'number') {
        const str = String(task);
        const match = str.match(/(?:work_items|issues)\/(\d+)/);
        return match ? match[1] : str;
    }
    if (task.href) {
        const match = String(task.href).match(/(?:work_items|issues)\/(\d+)/);
        if (match) return match[1];
    }
    return String(task.id || '');
}

function shouldBackfillParent(currentTasks, backfilledSet, lastTitle, currentTitle) {
    if (!currentTasks || currentTasks.size === 0 || !currentTitle) return false;
    if (lastTitle !== currentTitle) return true;
    for (const taskId of currentTasks.keys()) {
        if (!backfilledSet || !backfilledSet.has(taskId)) {
            return true;
        }
    }
    return false;
}

function filterAndSortTasks(tasks, options = {}) {
    if (!tasks || !Array.isArray(tasks)) return [];
    const query = (options.query || '').trim().toLowerCase();
    const sortKey = options.sortKey || null;
    const sortOrder = options.sortOrder || null; // 'asc' | 'desc'

    let result = tasks.filter(Boolean);

    if (query) {
        result = result.filter(task => {
            const title = (task.title || '').toLowerCase();
            const id = String(task.id || '').toLowerCase();
            return title.includes(query) || id.includes(query);
        });
    }

    if (sortKey && (sortOrder === 'asc' || sortOrder === 'desc')) {
        result = [...result].sort((a, b) => {
            let comp = 0;
            if (sortKey === 'estimate') {
                comp = (a.estimateHour || 0) - (b.estimateHour || 0);
            } else if (sortKey === 'spent') {
                comp = (a.spentHour || 0) - (b.spentHour || 0);
            } else if (sortKey === 'diff') {
                comp = (a.diffHour || 0) - (b.diffHour || 0);
            } else if (sortKey === 'title') {
                comp = (a.title || '').localeCompare(b.title || '');
            }
            return sortOrder === 'asc' ? comp : -comp;
        });
    }

    return result;
}

function renderTaskTableRows(tasks, options = {}) {
    const isSyncing = Boolean(options && options.isSyncing);
    const isFiltered = options ? (options.isFiltered !== undefined ? options.isFiltered : true) : true;

    if (!tasks || tasks.length === 0) {
        const emptyMsg = isSyncing
            ? '⏳ Đang quét danh sách task con và đồng bộ số liệu từ GitLab...'
            : (isFiltered ? 'Không tìm thấy task con nào phù hợp' : 'Không tìm thấy task con nào thuộc về bạn trên trang này.');
        return `
            <tr>
                <td colspan="7" class="gl-kpi-empty-cell" style="text-align: center; padding: 24px; color: #64748b;">
                    ${emptyMsg}
                </td>
            </tr>`;
    }

    return tasks.map(task => {
        const id = escapeHtml(String(task.id || ''));
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
        } else if (task.estimateHour != null && task.spentHour != null) {
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

function renderSummaryModalHtml(metrics, tasks = [], parentTitle = '', options = {}) {
    const isSyncing = Boolean(options && options.isSyncing);
    const safeParentTitle = escapeHtml(parentTitle);
    const safeMetrics = metrics || calculateChildTaskMetrics([]);
    const diffSign = safeMetrics.diffHours > 0 ? `+${safeMetrics.diffHours}h` : `${safeMetrics.diffHours}h`;
    const diffColorClass = safeMetrics.diffHours >= 0 ? 'gl-text-success' : 'gl-text-danger';
    const onTimeColorClass = safeMetrics.onTimeRate >= 80 ? 'gl-text-success' : (safeMetrics.onTimeRate >= 50 ? 'gl-text-warning' : 'gl-text-danger');

    const tableRowsHtml = renderTaskTableRows(tasks, { isSyncing, isFiltered: false });

    return `
<div id="gitlabKpiSummaryModal" class="gl-kpi-modal-overlay">
    <div class="gl-kpi-modal-dialog">
        <div class="gl-kpi-modal-header">
            <div>
                <h3 class="gl-kpi-modal-title">📊 Tổng hợp Task con của tôi</h3>
                ${safeParentTitle ? `<div class="gl-kpi-modal-subtitle">${safeParentTitle}</div>` : ''}
                ${isSyncing ? `<div class="gl-kpi-sync-status" style="font-size: 12px; color: #1068bf; margin-top: 4px; display: flex; align-items: center; gap: 6px;"><span class="gl-spinner" style="display: inline-block; width: 12px; height: 12px; border: 2px solid #1068bf; border-top-color: transparent; border-radius: 50%; animation: gl-spin 0.8s linear infinite;"></span> Đang đồng bộ số liệu mới nhất từ GitLab...</div>` : ''}
            </div>
            <div class="gl-kpi-header-actions">
                <button id="glKpiAddAllBtn" class="btn btn-sm btn-success gl-button"${!tasks || tasks.length === 0 ? ' disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}>➕ Thêm tất cả vào KPI</button>
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
            <!-- Search & Count Toolbar -->
            <div class="gl-kpi-toolbar">
                <div class="gl-kpi-search-box">
                    <input type="text" id="glKpiSearchInput" class="gl-kpi-search-input" placeholder="🔍 Tìm kiếm theo tên hoặc #id task...">
                </div>
                <div id="glKpiTaskCount" class="gl-kpi-task-count">
                    Hiển thị <strong>${tasks ? tasks.length : 0}</strong> / ${tasks ? tasks.length : 0} task
                </div>
            </div>
            <!-- Detailed Task Table -->
            <div class="gl-kpi-table-wrapper">
                <table class="gl-kpi-table">
                    <thead>
                        <tr>
                            <th class="gl-kpi-sortable" data-sort-key="title" style="cursor: pointer; user-select: none;">Task <span class="gl-kpi-sort-icon">↕</span></th>
                            <th class="gl-kpi-sortable gl-kpi-num" data-sort-key="estimate" style="cursor: pointer; user-select: none;">Estimate <span class="gl-kpi-sort-icon">↕</span></th>
                            <th class="gl-kpi-sortable gl-kpi-num" data-sort-key="spent" style="cursor: pointer; user-select: none;">Spent <span class="gl-kpi-sort-icon">↕</span></th>
                            <th class="gl-kpi-sortable gl-kpi-num" data-sort-key="diff" style="cursor: pointer; user-select: none;">Chênh lệch <span class="gl-kpi-sort-icon">↕</span></th>
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

// --- Modal Styles & Helpers ---

function getModalStyles() {
    return `
#gitlabKpiSummaryModal.gl-kpi-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.45);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
    box-sizing: border-box;
}

#gitlabKpiSummaryModal .gl-kpi-modal-dialog {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
    width: 92%;
    max-width: 980px;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    font-size: 14px;
    color: #1f2937;
    border: 1px solid #dcdcde;
    animation: glKpiFadeIn 0.15s ease-out;
}

@keyframes glKpiFadeIn {
    from { opacity: 0; transform: scale(0.97); }
    to { opacity: 1; transform: scale(1); }
}

#gitlabKpiSummaryModal .gl-kpi-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #fafafa;
}

#gitlabKpiSummaryModal .gl-kpi-modal-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
}

#gitlabKpiSummaryModal .gl-kpi-modal-subtitle {
    margin-top: 3px;
    font-size: 12px;
    color: #6b7280;
    font-weight: normal;
}

#gitlabKpiSummaryModal .gl-kpi-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

#gitlabKpiSummaryModal .gl-kpi-close-icon {
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
    user-select: none;
}

#gitlabKpiSummaryModal .gl-kpi-close-icon:hover {
    color: #111827;
    background: #e5e7eb;
}

#gitlabKpiSummaryModal .gl-kpi-modal-body {
    padding: 18px 20px;
    overflow-y: auto;
    max-height: calc(88vh - 70px);
}

#gitlabKpiSummaryModal .gl-kpi-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

#gitlabKpiSummaryModal .gl-kpi-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    text-align: center;
}

#gitlabKpiSummaryModal .gl-kpi-card-title {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

#gitlabKpiSummaryModal .gl-kpi-card-value {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
}

#gitlabKpiSummaryModal .gl-kpi-card-sub {
    font-size: 11px;
    color: #64748b;
    display: flex;
    justify-content: center;
    gap: 4px;
    align-items: center;
}

#gitlabKpiSummaryModal .gl-kpi-table-wrapper {
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
}

#gitlabKpiSummaryModal .gl-kpi-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
}

#gitlabKpiSummaryModal .gl-kpi-table th {
    background: #f9fafb;
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
    font-weight: 600;
    color: #374151;
}

#gitlabKpiSummaryModal .gl-kpi-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #f3f4f6;
    color: #1f2937;
    vertical-align: middle;
}

#gitlabKpiSummaryModal .gl-kpi-table tr:last-child td {
    border-bottom: none;
}

#gitlabKpiSummaryModal .gl-kpi-table tr:hover td {
    background: #f8fafc;
}

#gitlabKpiSummaryModal .gl-kpi-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
}

#gitlabKpiSummaryModal .gl-kpi-table th:nth-child(2),
#gitlabKpiSummaryModal .gl-kpi-table th:nth-child(3),
#gitlabKpiSummaryModal .gl-kpi-table th:nth-child(4) {
    text-align: right;
}

#gitlabKpiSummaryModal .gl-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 12px;
    line-height: 1.4;
}

#gitlabKpiSummaryModal .gl-badge-opened {
    background: #e0f2fe;
    color: #0284c7;
}

#gitlabKpiSummaryModal .gl-badge-closed {
    background: #ecfdf5;
    color: #059669;
}

#gitlabKpiSummaryModal .gl-badge-success {
    background: #dcfce7;
    color: #16a34a;
}

#gitlabKpiSummaryModal .gl-badge-danger {
    background: #fee2e2;
    color: #dc2626;
}

#gitlabKpiSummaryModal .gl-badge-warning {
    background: #fef3c7;
    color: #d97706;
}

#gitlabKpiSummaryModal .gl-badge-info {
    background: #e0e7ff;
    color: #4338ca;
}

#gitlabKpiSummaryModal .gl-text-success {
    color: #16a34a !important;
}

#gitlabKpiSummaryModal .gl-text-danger {
    color: #dc2626 !important;
}

#gitlabKpiSummaryModal .gl-text-warning {
    color: #d97706 !important;
}

#gitlabKpiSummaryModal .gl-kpi-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    gap: 12px;
}

#gitlabKpiSummaryModal .gl-kpi-search-box {
    display: flex;
    align-items: center;
    position: relative;
}

#gitlabKpiSummaryModal .gl-kpi-search-input {
    padding: 6px 12px;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    font-size: 13px;
    width: 280px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
}

#gitlabKpiSummaryModal .gl-kpi-search-input:focus {
    border-color: #0969da;
    box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.15);
}

#gitlabKpiSummaryModal .gl-kpi-task-count {
    font-size: 12px;
    color: #64748b;
    user-select: none;
}

#gitlabKpiSummaryModal th.gl-kpi-sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.15s;
}

#gitlabKpiSummaryModal th.gl-kpi-sortable:hover {
    background-color: #f1f5f9;
}

#gitlabKpiSummaryModal th.gl-kpi-sort-active {
    background-color: #e2e8f0;
    color: #0969da;
}

#gitlabKpiSummaryModal .gl-kpi-sort-icon {
    font-size: 11px;
    margin-left: 4px;
    opacity: 0.6;
}

#gitlabKpiSummaryModal th.gl-kpi-sort-active .gl-kpi-sort-icon {
    opacity: 1;
    color: #0969da;
}

.custom-summary-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 6px;
    vertical-align: middle;
}

@keyframes gl-spin {
    to { transform: rotate(360deg); }
}
`.trim();
}

function ensureModalStyles(doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc || !doc.head) return;
    if (doc.getElementById('gitlab-kpi-summary-styles')) return;

    const styleEl = doc.createElement('style');
    styleEl.id = 'gitlab-kpi-summary-styles';
    styleEl.textContent = getModalStyles();
    doc.head.appendChild(styleEl);
}

function createSummaryButton(doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return null;
    const button = doc.createElement('button');
    button.id = 'kpiSummaryTasksBtn';
    button.className = 'btn btn-default btn-sm gl-button custom-summary-button';
    button.setAttribute('type', 'button');
    button.title = 'Tổng hợp task con của tôi';
    button.innerHTML = `<span>📊</span><span>Tổng hợp task</span>`;
    return button;
}

function findEditButtonPlacement(doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return null;

    // 1. Primary: Edit title button or standard edit button
    const editBtn = doc.querySelector(
        '[data-testid="edit-title-button"], button.js-issuable-edit, [data-testid="issue-edit-button"], [data-testid="work-item-actions-dropdown"]'
    );
    if (editBtn) {
        return { target: editBtn, position: 'after' };
    }

    // 2. Secondary: Detail page header actions container button or container
    const headerBtn = doc.querySelector('.detail-page-header-actions .btn-default');
    if (headerBtn) {
        return { target: headerBtn, position: 'after' };
    }
    const headerActions = doc.querySelector('.detail-page-header-actions');
    if (headerActions) {
        return { target: headerActions, position: 'append' };
    }

    // 3. Fallback: Adjacent to issue title
    const titleEl = doc.querySelector('h1.title, [data-testid="issue-title"], .issue-details .title');
    if (titleEl) {
        return { target: titleEl, position: 'after' };
    }

    return null;
}

function injectSummaryButton(doc = (typeof document !== 'undefined' ? document : null), onClickHandler = null) {
    if (!doc) return null;
    const existing = doc.getElementById('kpiSummaryTasksBtn');
    if (existing) {
        return existing;
    }

    const placement = findEditButtonPlacement(doc);
    if (!placement || !placement.target) {
        return null;
    }

    const btn = createSummaryButton(doc);
    if (onClickHandler && typeof btn.addEventListener === 'function') {
        btn.addEventListener('click', onClickHandler);
    }

    if (placement.position === 'after') {
        if (typeof placement.target.after === 'function') {
            placement.target.after(btn);
        } else if (placement.target.parentNode) {
            placement.target.parentNode.insertBefore(btn, placement.target.nextSibling);
        }
    } else if (placement.position === 'append') {
        placement.target.appendChild(btn);
    } else {
        if (placement.target.parentNode) {
            placement.target.parentNode.appendChild(btn);
        }
    }

    return btn;
}

function extractChildTasksFromDom(container = (typeof document !== 'undefined' ? document : null)) {
    if (!container) return [];
    let items = container.querySelectorAll('ul[data-testid="child-items-container"] > li.tree-item');
    if (!items || items.length === 0) {
        items = container.querySelectorAll('#tasks li.tree-item, [data-testid="child-items-container"] li, li[data-testid="work-item-tree-item"]');
    }
    if (!items || items.length === 0) return [];

    const extracted = [];
    items.forEach(li => {
        const linkChild = li.querySelector('div[data-testid="links-child"]');
        let id = linkChild?.getAttribute('parent-work-item-id');
        const anchor = li.querySelector('a[href*="/work_items/"], a[href*="/issues/"]') || li.querySelector('a');
        const href = anchor ? (anchor.getAttribute('href') || anchor.href || '') : '';

        if (!id && href) {
            const match = href.match(/work_items\/(\d+)|issues\/(\d+)/);
            if (match) id = match[1] || match[2];
        }

        if (!id && !href) return;

        const title = (anchor?.innerText?.trim() || anchor?.getAttribute('title')?.trim() || (id ? `Task #${id}` : 'Không có tiêu đề'));
        const avatarLink = li.querySelector('div.gl-avatars-inline-child > a, div.gl-avatars-inline-child a, [data-testid="avatar-link"], .gl-avatar-link');
        const assigneeUrl = avatarLink ? (avatarLink.getAttribute('href') || avatarLink.href || '') : '';

        const isClosed = (
            li.classList?.contains('gl-badge-closed') ||
            li.classList?.contains('is-closed') ||
            li.querySelector?.('.gl-badge-closed') !== null ||
            li.querySelector?.('[data-testid="status-closed"]') !== null ||
            (li.getAttribute?.('data-state') === 'closed')
        );
        const state = isClosed ? 'closed' : 'opened';

        extracted.push({
            id: String(id || ''),
            href,
            title,
            assigneeUrl,
            state
        });
    });

    return extracted;
}

function enrichChildTasks(tasks, userProfile, storedKpi = []) {
    if (!Array.isArray(tasks)) return [];
    const userUrl = userProfile?.web_url;
    const filtered = filterMyChildTasks(tasks, userUrl);

    const kpiMap = new Map();
    if (Array.isArray(storedKpi)) {
        storedKpi.forEach(item => {
            if (!item) return;
            if (item.id) kpiMap.set(String(item.id), item);
            if (item.taskUrl) kpiMap.set(item.taskUrl, item);
        });
    }

    return filtered.map(task => {
        const kpi = kpiMap.get(String(task.id)) || (task.href ? kpiMap.get(task.href) : null);
        if (kpi) {
            const est = kpi.estimate != null ? Number(kpi.estimate) : 0;
            const spent = kpi.spent != null ? Number(kpi.spent) : 0;
            const diff = roundToOneDecimal(est - spent);
            const isLate = kpi.progress === 'Trễ hạn' || Boolean(kpi.isLate);
            const isUnplanned = kpi.type === 'Phát sinh' || Boolean(kpi.isUnplanned);
            const state = (kpi.state || task.state || 'opened').toLowerCase();

            return {
                ...task,
                estimateHour: est,
                spentHour: spent,
                diffHour: diff,
                isLate,
                isUnplanned,
                state
            };
        }

        return {
            ...task,
            estimateHour: 0,
            spentHour: 0,
            diffHour: 0,
            isLate: false,
            isUnplanned: false,
            state: (task.state || 'opened').toLowerCase()
        };
    });
}

function batchAddTasksToStorage(tasks, parentInfo = {}, currentStored = []) {
    const list = Array.isArray(currentStored) ? [...currentStored] : [];
    let addedCount = 0;
    const parentTitle = parentInfo.parentTitle || '';
    const parentUrl = parentInfo.parentUrl || '';
    const parentIid = parentInfo.parentIid || '';

    if (Array.isArray(tasks)) {
        tasks.forEach(task => {
            if (!task || !task.id) return;
            const strId = String(task.id);
            const existingIdx = list.findIndex(item => String(item.id) === strId);

            if (existingIdx === -1) {
                list.push({
                    id: strId,
                    href: task.href || '',
                    createAt: new Date().toLocaleString(),
                    parentTitle,
                    parentUrl,
                    parentIid,
                    taskTitle: task.title || ''
                });
                addedCount++;
            } else {
                const item = list[existingIdx];
                let changed = false;
                if (!item.parentTitle && parentTitle) {
                    item.parentTitle = parentTitle;
                    changed = true;
                }
                if (!item.parentUrl && parentUrl) {
                    item.parentUrl = parentUrl;
                    changed = true;
                }
                if (!item.parentIid && parentIid) {
                    item.parentIid = parentIid;
                    changed = true;
                }
                if (!item.taskTitle && task.title) {
                    item.taskTitle = task.title;
                    changed = true;
                }
                if (changed) {
                    list[existingIdx] = { ...item };
                }
            }
        });
    }

    return { updatedList: list, addedCount };
}

async function fetchTaskDetail(projectPath, iidOrTask, token, customEndpoint = null) {
    if (!projectPath || !iidOrTask || !token) return null;
    const iid = resolveTaskIid(iidOrTask);
    if (!iid) return null;

    const queryData = {
        operationName: "namespaceWorkItem",
        variables: {
            fullPath: projectPath,
            iid: String(iid),
        },
        query: `
        query namespaceWorkItem($fullPath: ID!, $iid: String!) {
          workspace: namespace(fullPath: $fullPath) {
            id
            workItem(iid: $iid) {
              id
              iid
              title
              state
              closedAt
              widgets {
                type
                ... on WorkItemWidgetStartAndDueDate {
                  dueDate
                  startDate
                }
                ... on WorkItemWidgetTimeTracking {
                  timeEstimate
                  totalTimeSpent
                }
                ... on WorkItemWidgetLabels {
                  labels {
                    nodes {
                      title
                    }
                  }
                }
              }
            }
          }
        }
        `
    };

    const endpoint = customEndpoint || (
        (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
            ? `${window.location.origin}/api/graphql`
            : 'https://gitlab.widosoft.com/api/graphql'
    );

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(queryData),
        });
        const res = await response.json();
        return res?.data?.workspace?.workItem || null;
    } catch (err) {
        console.warn('Error fetching task detail for iid ' + iid + ':', err);
        return null;
    }
}

function parseGraphQLChildrenNodes(childrenNodes = []) {
    if (!Array.isArray(childrenNodes)) return [];
    return childrenNodes.map(node => {
        if (!node) return null;
        const widgets = node.widgets || [];
        const timeTracking = widgets.find(w => w.type === 'TIME_TRACKING');
        const labels = widgets.find(w => w.type === 'LABELS');
        const startAndDueDate = widgets.find(w => w.type === 'START_AND_DUE_DATE');
        const assignees = widgets.find(w => w.type === 'ASSIGNEES');

        const est = timeTracking?.timeEstimate ? parseFloat((timeTracking.timeEstimate / 3600).toFixed(2)) : 0;
        const spent = timeTracking?.totalTimeSpent ? parseFloat((timeTracking.totalTimeSpent / 3600).toFixed(2)) : 0;
        const diff = roundToOneDecimal(est - spent);
        const isUnplanned = labels?.labels?.nodes?.some(l => l.title?.toLowerCase() === 'unplanned') || false;
        const isLate = (node.state === 'closed' && node.closedAt && startAndDueDate?.dueDate)
            ? (node.closedAt.slice(0, 10) > startAndDueDate.dueDate)
            : false;

        const assigneeUrl = assignees?.assignees?.nodes?.[0]?.webUrl || '';

        return {
            id: String(node.iid || node.id || ''),
            href: node.webUrl || '',
            title: node.title || (node.iid ? `Task #${node.iid}` : ''),
            assigneeUrl,
            estimateHour: est,
            spentHour: spent,
            diffHour: diff,
            state: (node.state || 'opened').toLowerCase(),
            isLate,
            isUnplanned
        };
    }).filter(Boolean);
}

async function fetchParentTaskWithChildren(projectPath, parentIid, token, customEndpoint = null) {
    if (!projectPath || !parentIid || !token) return null;
    const iid = String(parentIid);

    const queryData = {
        operationName: "namespaceWorkItemWithChildren",
        variables: {
            fullPath: projectPath,
            iid: iid,
        },
        query: `
        query namespaceWorkItemWithChildren($fullPath: ID!, $iid: String!) {
          workspace: namespace(fullPath: $fullPath) {
            id
            workItem(iid: $iid) {
              id
              iid
              title
              widgets {
                type
                ... on WorkItemWidgetHierarchy {
                  hasChildren
                  children(first: 100) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      iid
                      title
                      state
                      closedAt
                      webUrl
                      widgets {
                        type
                        ... on WorkItemWidgetTimeTracking {
                          timeEstimate
                          totalTimeSpent
                        }
                        ... on WorkItemWidgetStartAndDueDate {
                          dueDate
                          startDate
                        }
                        ... on WorkItemWidgetLabels {
                          labels {
                            nodes {
                              title
                            }
                          }
                        }
                        ... on WorkItemWidgetAssignees {
                          assignees {
                            nodes {
                              id
                              name
                              username
                              webUrl
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        `
    };

    const endpoint = customEndpoint || (
        (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
            ? `${window.location.origin}/api/graphql`
            : 'https://gitlab.widosoft.com/api/graphql'
    );

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(queryData),
        });
        const res = await response.json();
        const workItem = res?.data?.workspace?.workItem;
        if (!workItem) return null;

        const hierarchyWidget = workItem.widgets?.find(w => w.type === 'HIERARCHY' || w.__typename === 'WorkItemWidgetHierarchy');
        const childrenNodes = hierarchyWidget?.children?.nodes || [];
        return parseGraphQLChildrenNodes(childrenNodes);
    } catch (err) {
        console.warn('Error fetching parent task with children for iid ' + iid + ':', err);
        return null;
    }
}

function closeSummaryModal(doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return;
    const existing = doc.getElementById('gitlabKpiSummaryModal');
    if (existing) {
        existing.remove();
    }
    if (typeof doc.removeEventListener === 'function' && doc._glKpiEscapeHandler) {
        doc.removeEventListener('keydown', doc._glKpiEscapeHandler);
        doc._glKpiEscapeHandler = null;
    }
    if (typeof window !== 'undefined' && window._glKpiEscapeHandler) {
        window.removeEventListener('keydown', window._glKpiEscapeHandler);
        window._glKpiEscapeHandler = null;
    }
}

let cachedChildTasks = null;

async function refreshSummaryModal(doc = (typeof document !== 'undefined' ? document : null), parentInfo = {}, options = {}) {
    if (!doc || !doc.body) return null;
    const safeParentInfo = parentInfo || {};

    let userProfile = options.userProfile || null;
    let token = options.token || null;
    let storedKpi = options.storedKpi || [];

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        if (!userProfile && typeof getUserProfile === 'function') userProfile = await getUserProfile();
        if (!token && typeof getAccessToken === 'function') token = await getAccessToken();
        if ((!storedKpi || storedKpi.length === 0) && typeof getStoredIds === 'function') storedKpi = await getStoredIds('KpiInfo');
    }

    const userUrl = userProfile?.web_url;
    let refreshedTasks = [];
    let usedGraphQLChildren = false;

    // Strategy 1: Direct GraphQL query to parent work item for all children (fetches up to 100 children without DOM pagination issues)
    if (token && typeof window !== 'undefined' && window.location) {
        const pathname = window.location.pathname || '';
        const matchProject = pathname.replace(/(?:\/-)?\/(issues|work_items)\/.*$/, '').replace(/^\//, '');
        const parentIid = safeParentInfo.parentIid || (pathname.match(/(?:issues|work_items)\/(\d+)/)?.[1]);

        if (matchProject && parentIid) {
            try {
                const apiChildren = await fetchParentTaskWithChildren(matchProject, parentIid, token);
                if (Array.isArray(apiChildren) && apiChildren.length > 0) {
                    refreshedTasks = filterMyChildTasks(apiChildren, userUrl);
                    usedGraphQLChildren = true;
                }
            } catch (err) {
                console.warn('Direct children query failed, falling back to DOM extraction:', err);
            }
        }
    }

    // Strategy 2: Fallback to DOM extraction if direct children query was not available or empty
    if (!usedGraphQLChildren) {
        let rawTasks = extractChildTasksFromDom(doc);
        if (rawTasks.length === 0 && options.waitForDom !== false) {
            const startTime = Date.now();
            while (Date.now() - startTime < 1600) {
                await new Promise(r => setTimeout(r, 200));
                rawTasks = extractChildTasksFromDom(doc);
                if (rawTasks.length > 0) break;
            }
        }

        refreshedTasks = enrichChildTasks(rawTasks, userProfile, storedKpi);

        if (token && typeof window !== 'undefined' && window.location) {
            const pathname = window.location.pathname || '';
            const matchProject = pathname.replace(/(?:\/-)?\/(issues|work_items)\/.*$/, '').replace(/^\//, '');
            if (matchProject && refreshedTasks.length > 0) {
                const livePromises = refreshedTasks.map(async (t) => {
                    try {
                        const childIid = resolveTaskIid(t);
                        const detail = await fetchTaskDetail(matchProject, childIid, token);
                        if (detail) {
                            const timeTracking = detail.widgets?.find(w => w.type === 'TIME_TRACKING');
                            const labels = detail.widgets?.find(w => w.type === 'LABELS');
                            const startAndDueDate = detail.widgets?.find(w => w.type === 'START_AND_DUE_DATE');

                            const est = timeTracking?.timeEstimate ? parseFloat((timeTracking.timeEstimate / 3600).toFixed(2)) : t.estimateHour;
                            const spent = timeTracking?.totalTimeSpent ? parseFloat((timeTracking.totalTimeSpent / 3600).toFixed(2)) : t.spentHour;
                            const diff = roundToOneDecimal(est - spent);
                            const isUnplanned = labels?.labels?.nodes?.some(l => l.title?.toLowerCase() === 'unplanned') || t.isUnplanned;
                            const isLate = (detail.state === 'closed' && detail.closedAt && startAndDueDate?.dueDate)
                                ? (detail.closedAt.slice(0, 10) > startAndDueDate.dueDate)
                                : t.isLate;

                            return {
                                ...t,
                                estimateHour: est,
                                spentHour: spent,
                                diffHour: diff,
                                state: detail.state || t.state,
                                isLate,
                                isUnplanned
                            };
                        }
                    } catch (e) {
                        console.warn('GraphQL enrichment failed for task', t.id, e);
                    }
                    return t;
                });
                refreshedTasks = await Promise.all(livePromises);
            }
        }
    }

    if (refreshedTasks && refreshedTasks.length > 0) {
        cachedChildTasks = refreshedTasks;
        if (typeof window !== 'undefined') {
            window._cachedChildTasks = refreshedTasks;
        }
    }

    // Only update modal if modal is still open
    const currentModal = doc.querySelector ? doc.querySelector('#gitlabKpiSummaryModal') : (doc.getElementById ? doc.getElementById('gitlabKpiSummaryModal') : null);
    if (!currentModal) return null;

    return openSummaryModal(safeParentInfo, refreshedTasks, doc, {
        userProfile,
        storedKpi,
        token,
        autoRefresh: false
    });
}

function openSummaryModal(parentInfo = {}, preloadedTasks = null, doc = (typeof document !== 'undefined' ? document : null), options = {}) {
    if (!doc || !doc.body) return null;
    ensureModalStyles(doc);
    closeSummaryModal(doc);

    const safeParentInfo = parentInfo || {};
    const parentTitle = safeParentInfo.parentTitle || '';

    let tasks = preloadedTasks;
    if (!tasks) {
        const rawTasks = extractChildTasksFromDom(doc);
        const userProfile = options.userProfile || null;
        const storedKpi = options.storedKpi || [];
        tasks = enrichChildTasks(rawTasks, userProfile, storedKpi);
    }

    const isAutoRefreshing = Boolean(options.autoRefresh && !preloadedTasks);
    const metrics = calculateChildTaskMetrics(tasks);
    const modalHtml = renderSummaryModalHtml(metrics, tasks, parentTitle, { isSyncing: isAutoRefreshing });

    let modalOverlay = null;
    if (typeof doc.createElement === 'function') {
        const temp = doc.createElement('div');
        temp.innerHTML = modalHtml;
        modalOverlay = temp.querySelector('#gitlabKpiSummaryModal') || (temp.children && temp.children.find(c => c.id === 'gitlabKpiSummaryModal')) || temp.firstElementChild || temp;
        if (modalOverlay) {
            doc.body.appendChild(modalOverlay);
        }
    }

    if (!modalOverlay) return null;

    // Attach Close handlers
    const closeBtn = modalOverlay.querySelector('#glKpiCloseBtn');
    if (closeBtn && typeof closeBtn.addEventListener === 'function') {
        closeBtn.addEventListener('click', () => closeSummaryModal(doc));
    }

    if (typeof modalOverlay.addEventListener === 'function') {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeSummaryModal(doc);
            }
        });
    }

    // Attach Escape key listener
    const escapeHandler = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            closeSummaryModal(doc);
        }
    };
    doc._glKpiEscapeHandler = escapeHandler;
    if (typeof doc.addEventListener === 'function') {
        doc.addEventListener('keydown', escapeHandler);
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window._glKpiEscapeHandler = escapeHandler;
        window.addEventListener('keydown', escapeHandler);
    }

    // Attach Add All button handler
    const addAllBtn = modalOverlay.querySelector('#glKpiAddAllBtn');
    if (addAllBtn && typeof addAllBtn.addEventListener === 'function') {
        addAllBtn.addEventListener('click', async () => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    const currentStored = (typeof getStoredIds === 'function') ? await getStoredIds('WorkItemIds') : [];
                    const { updatedList } = batchAddTasksToStorage(tasks, safeParentInfo, currentStored);
                    await chrome.storage.local.set({ ['WorkItemIds']: updatedList });
                }
                addAllBtn.innerText = '✔ Đã thêm tất cả vào KPI';
                if (addAllBtn.classList) {
                    addAllBtn.classList.remove('btn-success');
                    addAllBtn.classList.add('btn-default');
                }
                addAllBtn.disabled = true;

                if (typeof window !== 'undefined' && typeof window._onChildTasksAddedAll === 'function') {
                    window._onChildTasksAddedAll(tasks);
                }
            } catch (err) {
                console.error('Error batch adding tasks to storage:', err);
            }
        });
    }

    // Attach Refresh button handler
    const refreshBtn = modalOverlay.querySelector('#glKpiRefreshBtn');
    if (refreshBtn && typeof refreshBtn.addEventListener === 'function') {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerText = '⏳ Đang làm mới...';
            try {
                await refreshSummaryModal(doc, safeParentInfo, {
                    userProfile: options.userProfile,
                    storedKpi: options.storedKpi,
                    token: options.token,
                    waitForDom: false
                });
            } catch (err) {
                console.error('Error refreshing summary modal:', err);
                refreshBtn.disabled = false;
                refreshBtn.innerText = '🔄 Làm mới';
            }
        });
    }

    // Search & Column Sorting State & Handlers
    let currentSearchQuery = '';
    let currentSortKey = null;
    let currentSortOrder = null;

    const updateTable = () => {
        const filteredSorted = filterAndSortTasks(tasks, {
            query: currentSearchQuery,
            sortKey: currentSortKey,
            sortOrder: currentSortOrder
        });
        const tableBody = modalOverlay.querySelector ? modalOverlay.querySelector('#glKpiTableBody') : null;
        if (tableBody) {
            tableBody.innerHTML = renderTaskTableRows(filteredSorted, {
                isFiltered: Boolean(currentSearchQuery || currentSortKey)
            });
        }
        const countEl = modalOverlay.querySelector ? modalOverlay.querySelector('#glKpiTaskCount') : null;
        if (countEl) {
            countEl.innerHTML = `Hiển thị <strong>${filteredSorted.length}</strong> / ${tasks ? tasks.length : 0} task`;
        }
        const headers = modalOverlay.querySelectorAll ? modalOverlay.querySelectorAll('th.gl-kpi-sortable') : [];
        if (headers && headers.forEach) {
            headers.forEach(th => {
                const key = th.getAttribute ? th.getAttribute('data-sort-key') : null;
                const icon = th.querySelector ? th.querySelector('.gl-kpi-sort-icon') : null;
                if (key === currentSortKey && currentSortOrder) {
                    if (th.classList && th.classList.add) th.classList.add('gl-kpi-sort-active');
                    if (icon) icon.textContent = currentSortOrder === 'asc' ? '▲' : '▼';
                } else {
                    if (th.classList && th.classList.remove) th.classList.remove('gl-kpi-sort-active');
                    if (icon) icon.textContent = '↕';
                }
            });
        }
    };

    const searchInput = modalOverlay.querySelector ? modalOverlay.querySelector('#glKpiSearchInput') : null;
    if (searchInput && typeof searchInput.addEventListener === 'function') {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = (e.target && e.target.value) || '';
            updateTable();
        });
    }

    const sortHeaders = modalOverlay.querySelectorAll ? modalOverlay.querySelectorAll('th.gl-kpi-sortable') : [];
    if (sortHeaders && sortHeaders.forEach) {
        sortHeaders.forEach(th => {
            if (typeof th.addEventListener === 'function') {
                th.addEventListener('click', () => {
                    const key = th.getAttribute ? th.getAttribute('data-sort-key') : null;
                    if (!key) return;
                    if (currentSortKey === key) {
                        if (currentSortOrder === 'asc') {
                            currentSortOrder = 'desc';
                        } else if (currentSortOrder === 'desc') {
                            currentSortKey = null;
                            currentSortOrder = null;
                        }
                    } else {
                        currentSortKey = key;
                        currentSortOrder = 'asc';
                    }
                    updateTable();
                });
            }
        });
    }

    // Auto-refresh in background if requested
    if (isAutoRefreshing) {
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerText = '⏳ Đang đồng bộ...';
        }
        setTimeout(() => {
            refreshSummaryModal(doc, safeParentInfo, {
                userProfile: options.userProfile,
                storedKpi: options.storedKpi,
                token: options.token,
                waitForDom: true
            }).catch(err => {
                console.error('Auto refresh error:', err);
                if (refreshBtn) {
                    refreshBtn.disabled = false;
                    refreshBtn.innerText = '🔄 Làm mới';
                }
            });
        }, 50);
    }

    return modalOverlay;
}

// --- Browser Content Script Initialization ---
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.calculateChildTaskMetrics = calculateChildTaskMetrics;
    window.filterMyChildTasks = filterMyChildTasks;
    window.resolveTaskIid = resolveTaskIid;
    window.shouldBackfillParent = shouldBackfillParent;
    window.renderSummaryModalHtml = renderSummaryModalHtml;
    window.getModalStyles = getModalStyles;
    window.ensureModalStyles = ensureModalStyles;
    window.createSummaryButton = createSummaryButton;
    window.findEditButtonPlacement = findEditButtonPlacement;
    window.injectSummaryButton = injectSummaryButton;
    window.extractChildTasksFromDom = extractChildTasksFromDom;
    window.enrichChildTasks = enrichChildTasks;
    window.batchAddTasksToStorage = batchAddTasksToStorage;
    window.fetchTaskDetail = fetchTaskDetail;
    window.parseGraphQLChildrenNodes = parseGraphQLChildrenNodes;
    window.fetchParentTaskWithChildren = fetchParentTaskWithChildren;
    window.filterAndSortTasks = filterAndSortTasks;
    window.renderTaskTableRows = renderTaskTableRows;
    window.refreshSummaryModal = refreshSummaryModal;
    window.openSummaryModal = openSummaryModal;
    window.closeSummaryModal = closeSummaryModal;

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

        ensureModalStyles(document);

        async function handleSummaryButtonClick() {
            const parentInfo = getParentIssueInfo();
            const storedKpi = (typeof getStoredIds === 'function') ? await getStoredIds('KpiInfo') : [];
            const profile = (typeof getUserProfile === 'function') ? await getUserProfile() : userProfile;
            const token = (typeof getAccessToken === 'function') ? await getAccessToken() : null;

            const existingCache = cachedChildTasks || (typeof window !== 'undefined' ? window._cachedChildTasks : null);
            if (existingCache && existingCache.length > 0) {
                // Đã có dữ liệu từ lần lấy trước -> hiển thị ngay lập tức, không gọi lại API
                openSummaryModal(parentInfo, existingCache, document, {
                    userProfile: profile,
                    storedKpi,
                    token,
                    autoRefresh: false
                });
            } else {
                // Lần đầu tiên mở modal -> gọi API 1 lần để lấy số liệu mới nhất
                openSummaryModal(parentInfo, null, document, {
                    userProfile: profile,
                    storedKpi,
                    token,
                    autoRefresh: true
                });
            }
        }

        window._onChildTasksAddedAll = (tasks) => {
            if (!Array.isArray(tasks)) return;
            tasks.forEach(t => addedLinks.add(String(t.id)));
            const allAddButtons = document.querySelectorAll('.custom-add-button');
            allAddButtons.forEach(btn => {
                const container = btn.closest('div[data-testid="links-child"]');
                const wid = container?.getAttribute('parent-work-item-id');
                if (wid && addedLinks.has(wid)) {
                    btn.innerHTML = svgRemove;
                    btn.classList.remove('btn-success');
                    btn.classList.add('btn-danger');
                }
            });
        };

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
            if (!taskHeader) return;

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

        let processTasksTimer = null;
        function debouncedProcessTasks(delay = 250) {
            if (processTasksTimer) {
                clearTimeout(processTasksTimer);
            }
            processTasksTimer = setTimeout(() => {
                processTasks();
            }, delay);
        }

        const backfilledTaskIds = new Set();
        let lastBackfilledParentTitle = '';

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
                if (!position) return;

                // Kiểm tra nếu đã có nút thì bỏ qua
                if (position.querySelector('.custom-add-button')) return;

                const addButton = createAddButton(workItemId, anchor.href, taskTitle);
                addButton.classList.add('custom-add-button'); // Gắn class để kiểm tra sau này

                position.prepend(addButton);
            });

            // Tự động bổ sung thông tin Issue cha cho các task đang mở trên trang này nếu trước đó chưa có
            if (shouldBackfillParent(currentTasks, backfilledTaskIds, lastBackfilledParentTitle, parentInfo.parentTitle)) {
                for (const taskId of currentTasks.keys()) {
                    backfilledTaskIds.add(taskId);
                }
                lastBackfilledParentTitle = parentInfo.parentTitle;
                backfillParentInfo(currentTasks, parentInfo);
            }
        }

        // Khởi tạo nút Tổng hợp task ban đầu
        injectSummaryButton(document, handleSummaryButtonClick);

        // Bắt đầu quan sát từ phần tử gốc (ví dụ: body)
        const observer = new MutationObserver((mutations, obs) => {
            injectSummaryButton(document, handleSummaryButtonClick);

            const targetElement = document.querySelector("ul[data-testid='child-items-container']");
            if (targetElement) {
                debouncedProcessTasks(250);
                createRefreshButton();
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
        resolveTaskIid,
        shouldBackfillParent,
        renderSummaryModalHtml,
        getModalStyles,
        ensureModalStyles,
        createSummaryButton,
        findEditButtonPlacement,
        injectSummaryButton,
        extractChildTasksFromDom,
        enrichChildTasks,
        batchAddTasksToStorage,
        fetchTaskDetail,
        parseGraphQLChildrenNodes,
        fetchParentTaskWithChildren,
        filterAndSortTasks,
        renderTaskTableRows,
        refreshSummaryModal,
        openSummaryModal,
        closeSummaryModal
    };
}
