async function deletelocalStorage(key) {
    await chrome.storage.local.remove(key);
}

async function getStoredIds(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            resolve(result[key] || []);
        });
    });
}

async function getAccessToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['AccessToken'], (result) => {
            resolve(result['AccessToken']);
        });
    });
}

async function removeIdFromStorage(key, id) {
    const items = await getStoredIds(key);
    const filtered = items.filter(item => item.id !== id);
    await chrome.storage.local.set({ [key]: filtered });
}

async function getUserProfile() {
    if (!getAccessToken()) return;

    return new Promise((resolve) => {
        chrome.storage.local.get(['UserProfile'], (result) => {
            resolve(result['UserProfile']);
        });
    });
}

function compareDate(first, second) {
    return new Date(second) - new Date(first);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    if (dateStr instanceof Date) {
        if (isNaN(dateStr.getTime())) return '';
        const d = String(dateStr.getDate()).padStart(2, '0');
        const m = String(dateStr.getMonth() + 1).padStart(2, '0');
        const y = dateStr.getFullYear();
        return `${d}/${m}/${y}`;
    }
    const str = String(dateStr).trim();
    if (!str) return '';

    // 1. Nếu đã là định dạng DD/MM/YYYY
    const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
        return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
    }

    // 2. Nếu là YYYY-MM-DD hoặc ISO datetime
    const iso = (typeof parseToIsoDate === 'function') ? parseToIsoDate(str) : null;
    if (iso && iso.includes('-')) {
        const [y, m, d] = iso.split('-');
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    // 3. Fallback split '-' nếu có 3 phần
    const parts = str.split('-');
    if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }

    return str;
}

function isInPreviousWeek(date) {
    const currentDate = date instanceof Date ? date : new Date(date);

    const today = new Date();
    const dayOfWeek = today.getDay() || 7; // fix CN
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - dayOfWeek + 1);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setDate(startOfThisWeek.getDate() - 1);

    return currentDate >= startOfLastWeek && currentDate <= endOfLastWeek;
}

function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => {
        const safeUrl = url.replace(/"/g, '&quot;'); // Tránh lỗi HTML injection
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

function getCurrentWeekDates() {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay(); // 0 (CN) → 6 (T7)
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    monday.setDate(today.getDate() + diffToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const label = d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        days.push({ label, value });
    }
    return days;
}

function cleanGroupName(groupName) {
    return groupName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function parseToIsoDate(dateStr) {
    if (!dateStr) return '';
    if (dateStr instanceof Date) {
        if (isNaN(dateStr.getTime())) return '';
        const y = dateStr.getFullYear();
        const m = String(dateStr.getMonth() + 1).padStart(2, '0');
        const d = String(dateStr.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    const str = String(dateStr).trim();

    // 1. Try standard YYYY-MM-DD pattern
    const isoMatch = str.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
        const y = isoMatch[1];
        const m = String(isoMatch[2]).padStart(2, '0');
        const d = String(isoMatch[3]).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // 2. Try Date.parse (handles ISO strings and US locale 'M/D/YYYY')
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 3. Fallback for DD/MM/YYYY or strings containing dates like '12:52:22 30/09/2026'
    const dmyMatch = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
        const first = parseInt(dmyMatch[1], 10);
        const second = parseInt(dmyMatch[2], 10);
        const y = dmyMatch[3];
        if (first <= 12 && second > 12) {
            return `${y}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
        }
        return `${y}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
    }

    return '';
}

function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
}

function getCurrentWeekRange() {
    const today = new Date();
    const monday = getMonday(today);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    const start = parseToIsoDate(monday);
    const end = parseToIsoDate(sunday);
    const startDisplay = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`;
    const endDisplay = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}`;

    return {
        start,
        end,
        startDisplay,
        endDisplay,
        label: `⭐ Tuần hiện tại (${startDisplay} - ${endDisplay})`
    };
}

function getWeeksOfMonth(year, month) {
    const weeks = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    let currentMonday = getMonday(firstDay);
    const currentWeekRange = getCurrentWeekRange();

    let weekNum = 1;
    while (currentMonday <= lastDay) {
        const sunday = new Date(currentMonday);
        sunday.setDate(sunday.getDate() + 6);

        const start = parseToIsoDate(currentMonday);
        const end = parseToIsoDate(sunday);

        const startDisplay = `${String(currentMonday.getDate()).padStart(2, '0')}/${String(currentMonday.getMonth() + 1).padStart(2, '0')}`;
        const endDisplay = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}`;

        const isCurrent = (start === currentWeekRange.start && end === currentWeekRange.end);
        const label = `Tuần ${weekNum} (${startDisplay} - ${endDisplay})${isCurrent ? ' (Tuần này)' : ''}`;

        weeks.push({
            weekNum,
            start,
            end,
            startDisplay,
            endDisplay,
            label,
            isCurrent
        });

        currentMonday.setDate(currentMonday.getDate() + 7);
        weekNum++;
    }
    return weeks;
}

function getRecentMonths(count = 6) {
    const months = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const val = `${year}-${String(month).padStart(2, '0')}`;
        const label = `Tháng ${String(month).padStart(2, '0')}/${year}${i === 0 ? ' (Tháng này)' : ''}`;
        months.push({ year, month, value: val, label });
    }
    return months;
}

function getAvailableMonths(storedTasks = [], storedMRs = [], storedKpi = []) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentIsoMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const monthSet = new Set();

    // 1. Luôn thêm đủ 12 tháng của năm hiện tại
    for (let m = 1; m <= 12; m++) {
        monthSet.add(`${currentYear}-${String(m).padStart(2, '0')}`);
    }

    // 2. Quét toàn bộ ngày tháng trong dữ liệu đã lưu
    const allItems = [...(storedTasks || []), ...(storedMRs || []), ...(storedKpi || [])];
    allItems.forEach(item => {
        const dateStr = item?.addedAt || item?.createAt || item?.startDate || item?.dueDate || item?.closeDate;
        if (dateStr) {
            const iso = parseToIsoDate(dateStr);
            if (iso && iso.length >= 7) {
                const ym = iso.slice(0, 7);
                const y = parseInt(ym.slice(0, 4));
                if (y >= 2020 && y <= 2050) {
                    monthSet.add(ym);
                }
            }
        }
    });

    const sortedMonths = Array.from(monthSet).sort().reverse();

    return sortedMonths.map(val => {
        const [year, month] = val.split('-');
        const isCurrent = (val === currentIsoMonth);
        return {
            year: parseInt(year),
            month: parseInt(month),
            value: val,
            label: `Tháng ${month}/${year}${isCurrent ? ' (Tháng này)' : ''}`,
            isCurrent
        };
    });
}

function isDateInWeek(dateStr, startStr, endStr) {
    const iso = parseToIsoDate(dateStr);
    if (!iso) return false;
    return iso >= startStr && iso <= endStr;
}

function matchesFilter(itemDateStr, filterVal, selectedMonth, customStart = null, customEnd = null) {
    const iso = parseToIsoDate(itemDateStr);
    if (!iso) return false;

    if (filterVal === 'current_week') {
        const cw = getCurrentWeekRange();
        return iso >= cw.start && iso <= cw.end;
    }

    if (filterVal === 'all_month') {
        return iso.startsWith(selectedMonth);
    }

    if (filterVal.startsWith('week:')) {
        const parts = filterVal.split(':');
        const start = parts[1];
        const end = parts[2];
        return iso >= start && iso <= end;
    }

    if (filterVal.startsWith('day:')) {
        const targetDay = filterVal.replace('day:', '');
        return iso === targetDay;
    }

    if (filterVal === 'custom_range') {
        if (!customStart && !customEnd) return true;
        if (customStart && customEnd) return iso >= customStart && iso <= customEnd;
        if (customStart) return iso >= customStart;
        if (customEnd) return iso <= customEnd;
    }

    return true;
}

function isItemActiveInWeek(item, startIso, endIso) {
    if (!item) return false;
    const addedIso = parseToIsoDate(item.addedAt || item.createAt);
    if (!addedIso) return false;

    // 1. Tạo trong tuần này
    if (addedIso >= startIso && addedIso <= endIso) {
        return true;
    }

    // 2. Tạo trước tuần này nhưng chưa đóng, hoặc đóng trong/sau tuần này
    if (addedIso < startIso) {
        const closeIso = parseToIsoDate(item.closeDate);
        const isClosed = (item.state && ['closed', 'merged'].includes(String(item.state).toLowerCase())) || !!closeIso;

        // Nếu chưa đóng -> kéo sang tuần này
        if (!isClosed) return true;

        // Nếu có ngày đóng, ngày đóng phải >= ngày bắt đầu tuần này
        if (closeIso && closeIso >= startIso) {
            return true;
        }
    }

    return false;
}

function isItemCarryOver(item, weekStartIso) {
    if (!item || !weekStartIso) return false;
    const addedIso = parseToIsoDate(item.addedAt || item.createAt);
    return !!(addedIso && addedIso < weekStartIso);
}

function isItemActiveInFilter(item, filterVal, selectedMonth, customStart = null, customEnd = null) {
    if (!item) return false;
    const addedIso = parseToIsoDate(item.addedAt || item.createAt);
    if (!addedIso) return false;

    if (filterVal === 'current_week') {
        const cw = getCurrentWeekRange();
        return isItemActiveInWeek(item, cw.start, cw.end);
    }

    if (filterVal === 'all_month') {
        // Tạo trong tháng này
        if (addedIso.startsWith(selectedMonth)) {
            return true;
        }
        // Hoặc tạo trước tháng này nhưng chưa đóng trước ngày đầu tháng
        const monthStartIso = `${selectedMonth}-01`;
        if (addedIso < monthStartIso) {
            const closeIso = parseToIsoDate(item.closeDate);
            const isClosed = (item.state && ['closed', 'merged'].includes(String(item.state).toLowerCase())) || !!closeIso;
            if (!isClosed) return true;
            if (closeIso && closeIso >= monthStartIso) return true;
        }
        return false;
    }

    if (filterVal.startsWith('week:')) {
        const parts = filterVal.split(':');
        return isItemActiveInWeek(item, parts[1], parts[2]);
    }

    if (filterVal.startsWith('day:')) {
        const targetDay = filterVal.replace('day:', '');
        return addedIso === targetDay;
    }

    if (filterVal === 'custom_range') {
        if (!customStart && !customEnd) return true;
        const s = customStart || '2000-01-01';
        const e = customEnd || '2099-12-31';
        return isItemActiveInWeek(item, s, e);
    }

    return true;
}

function getWeeksForRange(startIso, endIso) {
    if (!startIso || !endIso) return [];
    if (startIso > endIso) {
        const tmp = startIso;
        startIso = endIso;
        endIso = tmp;
    }

    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    let currentMonday = getMonday(startDate);
    const weeks = [];
    let weekNum = 1;

    while (currentMonday <= endDate) {
        const sunday = new Date(currentMonday);
        sunday.setDate(sunday.getDate() + 6);

        const wStart = parseToIsoDate(currentMonday);
        const wEnd = parseToIsoDate(sunday);

        const startDisplay = `${String(currentMonday.getDate()).padStart(2, '0')}/${String(currentMonday.getMonth() + 1).padStart(2, '0')}`;
        const endDisplay = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}`;

        weeks.push({
            weekNum,
            start: wStart,
            end: wEnd,
            startDisplay,
            endDisplay,
            label: `Tuần ${weekNum} (${startDisplay} - ${endDisplay})`
        });

        currentMonday.setDate(currentMonday.getDate() + 7);
        weekNum++;
    }
    return weeks;
}

function normalizeGitLabUrl(url) {
    if (!url) return '';
    return String(url)
        .trim()
        .replace(/^http:\/\//i, 'https://')
        .split(/[?#]/)[0]
        .replace(/\/+$/, '')
        .replace(/\/-\//g, '/');
}

function isSameItem(itemA, itemB) {
    if (!itemA || !itemB) return false;

    // 1. So sánh ID nếu cả hai có ID
    const idA = itemA.id || itemA.workItemId || itemA.mergeRequestId;
    const idB = itemB.id || itemB.workItemId || itemB.mergeRequestId;
    if (idA && idB && String(idA) === String(idB)) {
        return true;
    }

    // 2. So sánh URL
    const urlA = itemA.taskUrl || itemA.href || '';
    const urlB = itemB.taskUrl || itemB.href || '';
    if (!urlA || !urlB) return false;

    const normA = normalizeGitLabUrl(urlA);
    const normB = normalizeGitLabUrl(urlB);
    if (normA && normB && normA === normB) {
        return true;
    }

    // 3. So sánh projectPath và IID cho cả work_items, issues, merge_requests
    const matchA = normA.match(/\.com\/(.+?)\/(?:issues|work_items|merge_requests)\/(\d+)$/i);
    const matchB = normB.match(/\.com\/(.+?)\/(?:issues|work_items|merge_requests)\/(\d+)$/i);
    if (matchA && matchB) {
        if (matchA[1].toLowerCase() === matchB[1].toLowerCase() && matchA[2] === matchB[2]) {
            return true;
        }
    }

    return false;
}

function getAttitudeScore(percent) {
    if (percent >= 80) return 1;
    if (percent >= 50) return 2;
    if (percent >= 30) return 3;
    if (percent >= 10) return 4;
    return 5;
}

function getVolumeScore(percent) {
    if (percent < 70) return 1;
    if (percent < 80) return 2;
    if (percent < 90) return 3;
    if (percent < 100) return 4;
    return 5;
}

function getQualityScore(percent) {
    if (percent >= 80) return 1;
    if (percent >= 50) return 2;
    if (percent >= 30) return 3;
    if (percent >= 10) return 4;
    return 5;
}

function calculateKpiScore(stats) {
    if (!stats || !stats.totalTask || stats.totalTask === 0) {
        return {
            totalScore: 0,
            attitudeScore: 0,
            volumeScore: 0,
            qualityScore: 0,
            badge: { text: "Chưa có dữ liệu", class: "badge-neutral", icon: "⚪" }
        };
    }
    const s15 = getAttitudeScore(parseFloat(stats.noEstimateRate || 0));
    const s20 = getAttitudeScore(parseFloat(stats.noStartDateRate || 0));
    const s25 = getAttitudeScore(parseFloat(stats.noDueDateRate || 0));
    const s30 = getAttitudeScore(parseFloat(stats.noSpentRate || 0));
    const s35 = getVolumeScore(parseFloat(stats.spentTimeVsWorkingHoursRate || 0));
    const s40 = getQualityScore(parseFloat(stats.lateRate || 0));
    const s45 = getQualityScore(parseFloat(stats.reopenRate || 0));

    const attitudeScore = (s15 * 0.25 + s20 * 0.25 + s25 * 0.25 + s30 * 0.25);
    const volumeScore = s35;
    const qualityScore = (s40 + s45) / 2;

    const total = (
        s15 * 0.25 +
        s20 * 0.25 +
        s25 * 0.25 +
        s30 * 0.25 +
        s35 * 3 +
        s40 * 3 +
        s45 * 3
    ) / 10;

    const totalScore = parseFloat(total.toFixed(2));

    let badge = { text: "Cần chú ý", class: "badge-danger", icon: "⚠️" };
    if (totalScore >= 4.5) {
        badge = { text: "Xuất sắc", class: "badge-success", icon: "🌟" };
    } else if (totalScore >= 3.8) {
        badge = { text: "Tốt", class: "badge-info", icon: "🟢" };
    } else if (totalScore >= 3.0) {
        badge = { text: "Khá", class: "badge-warning", icon: "🟡" };
    }

    return {
        totalScore,
        attitudeScore: parseFloat(attitudeScore.toFixed(2)),
        volumeScore: parseFloat(volumeScore.toFixed(2)),
        qualityScore: parseFloat(qualityScore.toFixed(2)),
        badge
    };
}

function calculateStats(data, customFilterVal = null, customMonth = null) {
    const totalItems = (data && data.length) ? data.length : 0;
    const workItems = Array.isArray(data) ? data.filter(it => !it.isMR) : [];
    const totalTask = workItems.length;

    let totalPlannedTask = 0;
    let totalEstimate = 0;
    let totalSpent = 0;
    let totalSpentPlannedTask = 0;
    let totalTaskNoStartDate = 0;
    let totalTaskNoDueDate = 0;
    let totalTaskNoEstimate = 0;
    let totalTaskNoSpent = 0;
    let totalTaskInTime = 0;
    let reopenCount = 0;
    let dailySpentTime = 0;

    const effectiveFilter = customFilterVal || 'all';
    const compareDateStr = (effectiveFilter && effectiveFilter.startsWith('day:'))
        ? effectiveFilter.replace('day:', '')
        : (typeof parseToIsoDate === 'function' ? parseToIsoDate(new Date()) : new Date().toISOString().slice(0, 10));

    if (Array.isArray(data)) {
        data.forEach(item => {
            const spent = typeof item.spent === 'number' ? item.spent : (parseFloat(item.spent) || 0);
            const est = typeof item.estimate === 'number' ? item.estimate : (parseFloat(item.estimate) || 0);

            if (!item.isMR) {
                if (item.type === 'Kế hoạch') {
                    totalPlannedTask += 1;
                    totalSpentPlannedTask += spent;
                }
                if (!item.startDate) totalTaskNoStartDate += 1;
                if (!item.dueDate) totalTaskNoDueDate += 1;
                if (est === 0) totalTaskNoEstimate += 1;
                if (spent === 0) totalTaskNoSpent += 1;
                if (item.progress === 'Đúng hạn') totalTaskInTime += 1;
                if (item.reopenTotal > 0) reopenCount += 1;
            }

            const createdAt = parseToIsoDate(item.addedAt || item.createAt);
            if (createdAt === compareDateStr) {
                dailySpentTime += spent;
            }

            totalEstimate += est;
            totalSpent += spent;
        });
    }

    const totalUnplannedTask = Math.max(0, totalTask - totalPlannedTask);
    const totalSpentUnplannedTask = Math.max(0, totalSpent - totalSpentPlannedTask);
    const totalTaskLate = Math.max(0, totalTask - totalTaskInTime);
    const totalTaskNotReopen = Math.max(0, totalTask - reopenCount);

    const calcRate = (num, denom) => (denom > 0 ? parseFloat(((num / denom) * 100).toFixed(2)) : 0);

    const noStartDateRate = calcRate(totalTaskNoStartDate, totalTask);
    const noDueDateRate = calcRate(totalTaskNoDueDate, totalTask);
    const noEstimateRate = calcRate(totalTaskNoEstimate, totalTask);
    const noSpentRate = calcRate(totalTaskNoSpent, totalTask);
    const onTimeRate = calcRate(totalTaskInTime, totalTask);
    const lateRate = calcRate(totalTaskLate, totalTask);
    const noReopenRate = calcRate(totalTaskNotReopen, totalTask);
    const reopenRate = calcRate(reopenCount, totalTask);
    const unplannedTaskRate = calcRate(totalUnplannedTask, totalTask);

    // Giờ làm việc tiêu chuẩn công ty: 192h cho cả tháng, 48h cho 1 tuần
    const isMonthReport = (customMonth || effectiveFilter === 'all_month' || (effectiveFilter && effectiveFilter.startsWith('month:')));
    const workingHours = isMonthReport ? 192 : 48;

    const spentTimeVsWorkingHoursRate = calcRate(totalSpent, workingHours);
    const spentTimeVsEstimateRate = calcRate(totalSpent, totalEstimate);
    const plannedSpentTimeVsTotalSpentTimeRate = calcRate(totalSpentPlannedTask, totalSpent);
    const unplannedSpentTimeVsTotalSpentTimeRate = calcRate(totalSpentUnplannedTask, totalSpent);

    return {
        totalItems,
        totalTask,
        totalPlannedTask,
        totalUnplannedTask,
        totalTimeWorkingInCompany: 48,
        totalEstimate: parseFloat(totalEstimate).toFixed(2),
        totalSpent: parseFloat(totalSpent).toFixed(2),
        totalSpentPlannedTask: parseFloat(totalSpentPlannedTask).toFixed(2),
        totalSpentUnplannedTask: parseFloat(totalSpentUnplannedTask).toFixed(2),
        totalTaskNoStartDate,
        totalTaskNoDueDate,
        totalTaskNoEstimate,
        totalTaskNoSpent,
        totalTaskInTime,
        totalTaskLate,
        totalTaskNotReopen,
        totalTaskReopen: reopenCount,
        dailySpentTime: parseFloat(dailySpentTime).toFixed(2),
        lastUpdated: new Date().toLocaleString(),

        totalTasks: totalTask,
        totalPlannedTasks: totalPlannedTask,
        totalUnplannedTasks: totalUnplannedTask,
        workingHours,
        totalEstimateTime: parseFloat(totalEstimate).toFixed(2),
        totalSpentTime: parseFloat(totalSpent).toFixed(2),
        totalPlannedSpentTime: parseFloat(totalSpentPlannedTask).toFixed(2),
        totalUnplannedSpentTime: parseFloat(totalSpentUnplannedTask).toFixed(2),
        tasksNoStartDate: totalTaskNoStartDate,
        tasksNoDueDate: totalTaskNoDueDate,
        tasksNoEstimate: totalTaskNoEstimate,
        tasksNoSpent: totalTaskNoSpent,
        tasksOnTime: totalTaskInTime,
        tasksLate: totalTaskLate,
        tasksNoReopen: totalTaskNotReopen,
        tasksReopen: reopenCount,

        noStartDateRate,
        noDueDateRate,
        noEstimateRate,
        noSpentRate,
        onTimeRate,
        lateRate,
        noReopenRate,
        reopenRate,
        unplannedTaskRate,
        spentTimeVsWorkingHoursRate,
        spentTimeVsEstimateRate,
        plannedSpentTimeVsTotalSpentTimeRate,
        unplannedSpentTimeVsTotalSpentTimeRate
    };
}

function getTodayStartIso(now = new Date()) {
    let d;
    if (now instanceof Date) {
        d = !isNaN(now.getTime()) ? now : new Date();
    } else if (typeof now === 'number' || typeof now === 'string') {
        const parsed = new Date(now);
        d = !isNaN(parsed.getTime()) ? parsed : new Date();
    } else {
        d = new Date();
    }
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    return midnight.toISOString();
}

function isTaskAlreadyAdded(issue, storedItems) {
    if (!Array.isArray(storedItems) || storedItems.length === 0) return false;
    const issueId = String(issue.id || '').trim();
    const issueIid = String(issue.iid || issue.id || '').trim();
    const issueHref = String(issue.web_url || issue.href || '').trim();
    const normIssueHref = normalizeGitLabUrl(issueHref).toLowerCase();
    const urlPattern = /^(?:https?:\/\/[^\/]+)?\/(.+?)\/(?:issues|work_items|merge_requests)\/(\d+)$/i;
    const issueMatch = normIssueHref ? normIssueHref.match(urlPattern) : null;

    for (const stored of storedItems) {
        if (!stored) continue;
        const storedId = String(stored.id || stored.workItemId || '').trim();
        const storedIid = String(stored.iid || '').trim();
        const storedHref = String(stored.href || stored.taskUrl || stored.web_url || '').trim();
        const normStoredHref = normalizeGitLabUrl(storedHref).toLowerCase();
        const storedMatch = normStoredHref ? normStoredHref.match(urlPattern) : null;

        // When both have URLs, enforce cross-project URL/path isolation
        if (normIssueHref && normStoredHref) {
            // 1. Direct normalized URL match
            if (normIssueHref === normStoredHref) {
                return true;
            }

            // 2. Project path and IID match across different URL schemas (/issues/ vs /work_items/)
            if (issueMatch && storedMatch) {
                if (issueMatch[1] === storedMatch[1] && issueMatch[2] === storedMatch[2]) {
                    return true;
                }
                // Different project URLs with both present -> do not match on IID
                continue;
            }

            // Both have URLs but differ -> do not match
            continue;
        }

        // When at least one URL is absent, fall back to direct ID / IID matching
        if (storedId && (storedId === issueId || (issueIid && storedId === issueIid))) {
            return true;
        }
        if (storedIid && (storedIid === issueIid || storedIid === issueId)) {
            return true;
        }

        // Match via isSameItem helper as fallback when URL is absent
        if (isSameItem({ id: issue.id, href: issueHref, taskUrl: issueHref }, stored)) {
            return true;
        }
    }
    return false;
}

function filterUnaddedTasks(apiIssues, storedWorkItems) {
    if (!Array.isArray(apiIssues) || apiIssues.length === 0) return [];
    const stored = Array.isArray(storedWorkItems) ? storedWorkItems : [];

    const unadded = [];
    for (const issue of apiIssues) {
        if (!issue) continue;
        if (!isTaskAlreadyAdded(issue, stored)) {
            unadded.push({
                id: String(issue.id),
                iid: String(issue.iid || issue.id),
                title: issue.title || '',
                href: issue.web_url || issue.href || '',
                createdAt: issue.created_at || issue.createdAt || ''
            });
        }
    }
    return unadded;
}

function evaluateKpiReminderState(now, settings = {}, state = {}) {
    let d;
    if (now instanceof Date) {
        d = !isNaN(now.getTime()) ? now : new Date();
    } else if (typeof now === 'number' || typeof now === 'string') {
        const parsed = new Date(now);
        d = !isNaN(parsed.getTime()) ? parsed : new Date();
    } else {
        d = new Date();
    }

    const todayDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let curState = { ...state };
    if (curState.lastDate !== todayDateStr) {
        curState = {
            lastDate: todayDateStr,
            count: 0,
            done: false,
            lastNotified: null
        };
    } else {
        curState.count = typeof curState.count === 'number' ? curState.count : 0;
        curState.done = !!curState.done;
        curState.lastNotified = curState.lastNotified || null;
    }

    const enabled = (settings && typeof settings.enabled === 'boolean') ? settings.enabled : true;

    // Non-workday check (Saturday = 6, Sunday = 0)
    const day = d.getDay();
    const isWorkday = (day >= 1 && day <= 5);
    if (!isWorkday) {
        return { shouldScan: false, shouldNotify: false, nextState: curState };
    }

    // Disabled or marked done for the day
    if (!enabled || curState.done) {
        return { shouldScan: false, shouldNotify: false, nextState: curState };
    }

    const checkOutTime = (settings && settings.checkOutTime) || '18:00';
    const minutesBefore = (settings && typeof settings.minutesBefore === 'number') ? settings.minutesBefore : 15;
    const parts = checkOutTime.split(':').map(Number);
    const targetHour = isNaN(parts[0]) ? 18 : parts[0];
    const targetMinute = isNaN(parts[1]) ? 0 : parts[1];
    const targetTotalMins = targetHour * 60 + targetMinute - minutesBefore;
    const currentTotalMins = d.getHours() * 60 + d.getMinutes();

    // If current time < target: no scan and no notify
    if (currentTotalMins < targetTotalMins) {
        return { shouldScan: false, shouldNotify: false, nextState: curState };
    }

    // If current time >= target: scan is enabled to update UI/cache
    const timeDiff = currentTotalMins - targetTotalMins;

    // If already notified max times (count >= 2) or exceeded 60m window: mark done and stop scanning
    if (curState.count >= 2 || timeDiff > 60) {
        return {
            shouldScan: false,
            shouldNotify: false,
            nextState: {
                ...curState,
                done: true
            }
        };
    }

    // Snooze cooldown when already notified at least once (default: 10 mins if omitted)
    if (curState.count > 0 && curState.lastNotified) {
        const snoozeMinutes = (settings && typeof settings.snoozeMinutes === 'number' && settings.snoozeMinutes > 0)
            ? settings.snoozeMinutes
            : 10;
        const minsSinceLast = (d.getTime() - new Date(curState.lastNotified).getTime()) / (60 * 1000);
        if (minsSinceLast < snoozeMinutes) {
            // In snooze cooldown: do not scan network, do not notify
            return { shouldScan: false, shouldNotify: false, nextState: curState };
        }
    }

    // Trigger scan and notification (alert 1 when count=0, alert 2 when count=1 after snooze)
    return {
        shouldScan: true,
        shouldNotify: true,
        nextState: {
            ...curState,
            count: curState.count + 1,
            lastNotified: d.toISOString()
        }
    };
}

async function fetchTodayCreatedIssues(token, baseUrl, todayStartIso, customFetch = (typeof fetch !== 'undefined' ? fetch : null)) {
    if (!token || !baseUrl || !todayStartIso) {
        return [];
    }
    const fetchFn = customFetch || (typeof fetch !== 'undefined' ? fetch : null);
    if (typeof fetchFn !== 'function') {
        return [];
    }
    const cleanBase = String(baseUrl).trim().replace(/\/+$/, '');
    const url = `${cleanBase}/api/v4/issues?scope=created_by_me&state=opened&created_after=${encodeURIComponent(todayStartIso)}&per_page=100`;

    try {
        const response = await fetchFn(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response || !response.ok) {
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (err) {
        return [];
    }
}

function sanitizeGitlabUrl(rawUrl, defaultUrl = 'https://gitlab.com') {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
        return defaultUrl;
    }
    let trimmed = rawUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
        trimmed = `https://${trimmed}`;
    }
    try {
        const parsed = new URL(trimmed);
        if (parsed.origin && parsed.origin !== 'null') {
            return parsed.origin;
        }
        return defaultUrl;
    } catch (e) {
        return defaultUrl;
    }
}

function getTokenGenerationUrl(serverUrl) {
    const baseUrl = sanitizeGitlabUrl(serverUrl);
    return `${baseUrl}/-/user_settings/personal_access_tokens`;
}

async function getGitlabServerUrl(storageArea = null, fallback = 'https://gitlab.com') {
    const targetStorage = storageArea || (typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null);
    if (targetStorage && typeof targetStorage.get === 'function') {
        try {
            const data = await new Promise((resolve, reject) => {
                let resolved = false;
                try {
                    const res = targetStorage.get(['gitlabServerUrl'], (result) => {
                        if (!resolved) {
                            resolved = true;
                            resolve(result);
                        }
                    });
                    if (res && typeof res.then === 'function') {
                        res.then((val) => {
                            if (!resolved) {
                                resolved = true;
                                resolve(val);
                            }
                        }).catch(reject);
                    }
                } catch (err) {
                    reject(err);
                }
            });
            if (data && data.gitlabServerUrl) {
                return sanitizeGitlabUrl(data.gitlabServerUrl, fallback);
            }
        } catch (e) {
            // fallback
        }
    }
    return sanitizeGitlabUrl(fallback, 'https://gitlab.com');
}

if (typeof window !== 'undefined') {
    window.deletelocalStorage = deletelocalStorage;
    window.getStoredIds = getStoredIds;
    window.getAccessToken = getAccessToken;
    window.removeIdFromStorage = removeIdFromStorage;
    window.getUserProfile = getUserProfile;
    window.compareDate = compareDate;
    window.formatDate = formatDate;
    window.isInPreviousWeek = isInPreviousWeek;
    window.linkify = linkify;
    window.getCurrentWeekDates = getCurrentWeekDates;
    window.cleanGroupName = cleanGroupName;
    window.parseToIsoDate = parseToIsoDate;
    window.getMonday = getMonday;
    window.getCurrentWeekRange = getCurrentWeekRange;
    window.getWeeksOfMonth = getWeeksOfMonth;
    window.getRecentMonths = getRecentMonths;
    window.getAvailableMonths = getAvailableMonths;
    window.isDateInWeek = isDateInWeek;
    window.matchesFilter = matchesFilter;
    window.isItemActiveInWeek = isItemActiveInWeek;
    window.isItemCarryOver = isItemCarryOver;
    window.isItemActiveInFilter = isItemActiveInFilter;
    window.getWeeksForRange = getWeeksForRange;
    window.normalizeGitLabUrl = normalizeGitLabUrl;
    window.isSameItem = isSameItem;
    window.getAttitudeScore = getAttitudeScore;
    window.getVolumeScore = getVolumeScore;
    window.getQualityScore = getQualityScore;
    window.calculateKpiScore = calculateKpiScore;
    window.calculateStats = calculateStats;
    window.getTodayStartIso = getTodayStartIso;
    window.isTaskAlreadyAdded = isTaskAlreadyAdded;
    window.filterUnaddedTasks = filterUnaddedTasks;
    window.evaluateKpiReminderState = evaluateKpiReminderState;
    window.fetchTodayCreatedIssues = fetchTodayCreatedIssues;
    window.sanitizeGitlabUrl = sanitizeGitlabUrl;
    window.getTokenGenerationUrl = getTokenGenerationUrl;
    window.getGitlabServerUrl = getGitlabServerUrl;
}

const _rootScope = typeof window !== 'undefined'
    ? window
    : (typeof self !== 'undefined'
        ? self
        : (typeof globalThis !== 'undefined' ? globalThis : null));

if (_rootScope) {
    _rootScope.sanitizeGitlabUrl = sanitizeGitlabUrl;
    _rootScope.getTokenGenerationUrl = getTokenGenerationUrl;
    _rootScope.getGitlabServerUrl = getGitlabServerUrl;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        deletelocalStorage,
        getStoredIds,
        getAccessToken,
        removeIdFromStorage,
        getUserProfile,
        compareDate,
        formatDate,
        isInPreviousWeek,
        linkify,
        getCurrentWeekDates,
        cleanGroupName,
        parseToIsoDate,
        getMonday,
        getCurrentWeekRange,
        getWeeksOfMonth,
        getRecentMonths,
        getAvailableMonths,
        isDateInWeek,
        matchesFilter,
        isItemActiveInWeek,
        isItemCarryOver,
        isItemActiveInFilter,
        getWeeksForRange,
        normalizeGitLabUrl,
        isSameItem,
        getAttitudeScore,
        getVolumeScore,
        getQualityScore,
        calculateKpiScore,
        calculateStats,
        getTodayStartIso,
        isTaskAlreadyAdded,
        filterUnaddedTasks,
        evaluateKpiReminderState,
        fetchTodayCreatedIssues,
        sanitizeGitlabUrl,
        getTokenGenerationUrl,
        getGitlabServerUrl
    };
}
