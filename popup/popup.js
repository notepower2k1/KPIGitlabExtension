function openNoteWindow() {
    if (typeof chrome !== 'undefined' && chrome.windows) {
        chrome.windows.create({
            url: chrome.runtime.getURL("note/note.html"),
            type: "popup",
            width: 520,
            height: 640
        });
    }
}

function openNoteTab() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("note/note.html")
        });
    }
}

function openTodoWindow() {
    if (typeof chrome !== 'undefined' && chrome.windows) {
        chrome.windows.create({
            url: chrome.runtime.getURL("todo/todo.html"),
            type: "popup",
            width: 540,
            height: 680
        });
    }
}

function openTodoTab() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({
            url: chrome.runtime.getURL("todo/todo.html")
        });
    }
}

(async () => {
    if (typeof getUserProfile !== 'function' || typeof document === 'undefined') {
        return;
    }
    const userProfile = await getUserProfile();

    if (userProfile) {
        renderUserProfile(userProfile);
    } else {
        document.getElementById("user-screen").style.display = "none";
    }

    document.getElementById("login-btn").addEventListener("click", async () => {
        const token = document.getElementById("token").value;

        if (!token) {
            alert("Vui lòng nhập token");
            return;
        }

        // Giả lập gọi API lấy thông tin user từ token
        await fetchUserProfile(token).then(user => {
            if (user) {
                renderUserProfile(user);
            } else {
                alert("Token không hợp lệ!");
            }
        });
        await addAccessToken(token);
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        document.getElementById("user-screen").style.display = "none";
        document.getElementById("login-screen").style.display = "flex"; // hoặc "block"

        deletelocalStorage('AccessToken');
        deletelocalStorage('UserProfile');
    });

    document.getElementById("tutorial-btn").addEventListener("click", () => {
        // Open new tab
        // chrome.tabs.create({ url: "https://gitlab.widosoft.com/-/user_settings/personal_access_tokens" });
        chrome.tabs.create({ url: chrome.runtime.getURL("tutorial/tutorial.html") });
    })


    async function renderUserProfile(user) {
        // Hiện user info
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("user-screen").style.display = "block";

        // Cập nhật thông tin
        document.getElementById("avatar").src = user.avatar_url;
        document.getElementById("username").textContent = user.username;
        document.getElementById("avatar-link").href = user.web_url;

        document.getElementById("manage-btn").onclick = () => {
            chrome.tabs.create({ url: chrome.runtime.getURL("page/page.html") });
        };

        const gitlabUsername = user?.username || '';
        const gitlabBaseUrl = 'https://gitlab.widosoft.com';

        const quickIssuesBtn = document.getElementById("quickIssuesBtn");
        const quickMRsBtn = document.getElementById("quickMRsBtn");
        const quickTodosBtn = document.getElementById("quickTodosBtn");

        if (quickIssuesBtn) {
            quickIssuesBtn.onclick = () => {
                const url = gitlabUsername
                    ? `${gitlabBaseUrl}/dashboard/issues?assignee_username=${encodeURIComponent(gitlabUsername)}`
                    : `${gitlabBaseUrl}/dashboard/issues`;
                chrome.tabs.create({ url });
            };
        }

        if (quickMRsBtn) {
            quickMRsBtn.onclick = () => {
                const url = gitlabUsername
                    ? `${gitlabBaseUrl}/dashboard/merge_requests?assignee_username=${encodeURIComponent(gitlabUsername)}`
                    : `${gitlabBaseUrl}/dashboard/merge_requests`;
                chrome.tabs.create({ url });
            };
        }

        if (quickTodosBtn) {
            quickTodosBtn.onclick = () => {
                chrome.tabs.create({ url: `${gitlabBaseUrl}/dashboard/todos` });
            };
        }

        const noteBtn = document.getElementById("note-btn");
        const noteWindowBtn = document.getElementById("note-window-btn");
        const noteTabBtn = document.getElementById("note-tab-btn");

        if (noteBtn) noteBtn.onclick = openNoteWindow;
        if (noteWindowBtn) noteWindowBtn.onclick = openNoteWindow;
        if (noteTabBtn) noteTabBtn.onclick = openNoteTab;

        const todoBtn = document.getElementById("todo-btn");
        const todoTabBtn = document.getElementById("todo-tab-btn");

        if (todoBtn) todoBtn.onclick = openTodoWindow;
        if (todoTabBtn) todoTabBtn.onclick = openTodoTab;

        // Xử lý chuyển tab
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                // Xoá class active khỏi tất cả
                document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

                // Thêm class active cho tab hiện tại
                btn.classList.add("active");
                document.getElementById(btn.dataset.tab).classList.add("active");
            });
        });


        document.getElementById("exportTask-btn").addEventListener("click", () => {
            chrome.storage.local.get(null, (allData) => {
                // Backup everything
                const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const date = new Date().toISOString().slice(0, 10);

                const a = document.createElement("a");
                a.href = url;
                a.download = `gitlab_productivity_backup_${date}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });
        });

        document.getElementById("importTask-btn").addEventListener("click", () => {
            document.getElementById("importFile").click();
        });

        document.getElementById("importFile").addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const text = await file.text();
            try {
                const data = JSON.parse(text);

                if (typeof data === 'object' && data !== null) {
                    if (confirm("Hành động này sẽ ghi đè dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?")) {
                        await chrome.storage.local.set(data);
                        alert("Import thành công! Vui lòng tải lại trang Dashboard nếu đang mở.");
                        window.location.reload(); // Reload popup to reflect changes
                    }
                } else {
                    alert("File không đúng định dạng JSON.");
                }
            } catch (err) {
                console.error(err);
                alert("Đọc file thất bại hoặc file không hợp lệ.");
            }
        });

        // Cài đặt Nhắc Check-in & Check-out
        async function initCheckInOutSettings() {
            const checkInEnabledEl = document.getElementById("checkInEnabled");
            const checkInTimeEl = document.getElementById("checkInTime");
            const checkOutEnabledEl = document.getElementById("checkOutEnabled");
            const checkOutTimeEl = document.getElementById("checkOutTime");
            const checkInOutSnoozeEl = document.getElementById("checkInOutSnooze");
            const checkInOutUrlEl = document.getElementById("checkInOutUrl");
            const saveBtn = document.getElementById("saveCheckInOutBtn");
            const testBtn = document.getElementById("testCheckInOutBtn");
            const saveMsg = document.getElementById("checkInOutSaveMsg");

            if (!checkInEnabledEl || !saveBtn) return;

            // Đọc cài đặt đã lưu
            const settings = await chrome.storage.local.get([
                'checkInEnabled',
                'checkInTime',
                'checkOutEnabled',
                'checkOutTime',
                'checkInOutSnoozeMinutes',
                'checkInOutUrl'
            ]);

            if (settings.checkInEnabled !== undefined) checkInEnabledEl.checked = settings.checkInEnabled;
            if (settings.checkInTime) checkInTimeEl.value = settings.checkInTime;
            if (settings.checkOutEnabled !== undefined) checkOutEnabledEl.checked = settings.checkOutEnabled;
            if (settings.checkOutTime) checkOutTimeEl.value = settings.checkOutTime;
            if (settings.checkInOutSnoozeMinutes !== undefined) checkInOutSnoozeEl.value = String(settings.checkInOutSnoozeMinutes);
            if (settings.checkInOutUrl) checkInOutUrlEl.value = settings.checkInOutUrl;

            // Xử lý lưu cài đặt
            saveBtn.addEventListener("click", async () => {
                const newSettings = {
                    checkInEnabled: checkInEnabledEl.checked,
                    checkInTime: checkInTimeEl.value || '08:30',
                    checkOutEnabled: checkOutEnabledEl.checked,
                    checkOutTime: checkOutTimeEl.value || '18:00',
                    checkInOutSnoozeMinutes: parseInt(checkInOutSnoozeEl.value, 10) || 0,
                    checkInOutUrl: checkInOutUrlEl.value.trim()
                };

                await chrome.storage.local.set(newSettings);

                if (saveMsg) {
                    saveMsg.style.display = "block";
                    setTimeout(() => {
                        saveMsg.style.display = "none";
                    }, 2500);
                }
            });

            // Xử lý thử chuông thông báo
            if (testBtn) {
                testBtn.addEventListener("click", () => {
                    const notifId = 'test-checkin-alert-' + Date.now();
                    const url = checkInOutUrlEl.value.trim();
                    chrome.notifications.create(notifId, {
                        type: "basic",
                        iconUrl: chrome.runtime.getURL("icon48.png"),
                        title: "🔔 Kiểm tra chuông nhắc việc",
                        message: url
                            ? "Thông báo hoạt động tốt! Nhấn vào đây để thử mở link chấm công."
                            : "Thông báo hoạt động tốt! Bạn có thể lưu lại cài đặt.",
                        priority: 2,
                        requireInteraction: true
                    });
                });
            }
        }

        await initCheckInOutSettings();

        const storedKpi = await getStoredIds('KpiInfo');
        const kpiStats = await getStoredIds('KpiStats');

        const today = new Date();
        const cw = getCurrentWeekRange();
        const currentMonthIso = (typeof parseToIsoDate === 'function' ? parseToIsoDate(today) : today.toISOString().slice(0, 10)).slice(0, 7);
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const y = today.getFullYear();

        // 1. Dữ liệu tuần
        let weekStats = null;
        if (Array.isArray(storedKpi) && storedKpi.length > 0) {
            const currentWeekData = storedKpi.filter(item => isItemActiveInWeek(item, cw.start, cw.end));
            weekStats = calculateStats(currentWeekData.length > 0 ? currentWeekData : storedKpi, 'current_week');
        } else if (kpiStats && !Array.isArray(kpiStats) && Object.keys(kpiStats).length > 0) {
            weekStats = kpiStats;
        }

        const weekStatsCard = document.querySelector("#week-tab .stats-card");
        if (!weekStats) {
            if (weekStatsCard) weekStatsCard.style.display = "none";
        } else {
            if (weekStatsCard) weekStatsCard.style.display = "block";
            const statsTimeEl = document.getElementById("stats-time");
            if (statsTimeEl) statsTimeEl.textContent = `${cw.startDisplay} - ${cw.endDisplay}`;

            document.getElementById("total-tasks").textContent = weekStats.totalTask || 0;
            document.getElementById("estimate-time").textContent = (weekStats.totalEstimate || 0) + 'h';
            document.getElementById("spent-time").textContent = (weekStats.totalSpent || 0) + 'h';

            const dailySpent = parseFloat(weekStats.dailySpentTime) || 0;
            const dailyTarget = 8;
            const dailyProgress = Math.min((dailySpent / dailyTarget) * 100, 100);
            document.getElementById("estimate-time-daily").textContent = `${dailySpent}h / ${dailyTarget}h`;
            document.getElementById("progress-fill-daily").style.width = `${dailyProgress}%`;

            const totalSpent = parseFloat(weekStats.totalSpent) || 0;
            const totalTarget = weekStats.totalTimeWorkingInCompany || 48;
            const totalProgress = Math.min((totalSpent / totalTarget) * 100, 100);
            document.getElementById("estimate-time-total").textContent = `${totalSpent}h / ${totalTarget}h`;
            document.getElementById("progress-fill").style.width = `${totalProgress}%`;
        }

        // 2. Dữ liệu tháng
        let monthStats = null;
        if (Array.isArray(storedKpi) && storedKpi.length > 0) {
            const currentMonthData = storedKpi.filter(item => isItemActiveInFilter(item, 'all_month', currentMonthIso));
            monthStats = calculateStats(currentMonthData, 'all_month', currentMonthIso);
        }

        const monthStatsCard = document.querySelector("#month-tab .stats-card");
        if (!monthStats) {
            if (monthStatsCard) monthStatsCard.style.display = "none";
        } else {
            if (monthStatsCard) monthStatsCard.style.display = "block";
            const monthTimeEl = document.getElementById("month-stats-time");
            if (monthTimeEl) monthTimeEl.textContent = `${m}/${y}`;

            document.getElementById("month-total-tasks").textContent = monthStats.totalTask || 0;
            document.getElementById("month-estimate-time").textContent = (monthStats.totalEstimate || 0) + 'h';
            document.getElementById("month-spent-time").textContent = (monthStats.totalSpent || 0) + 'h';

            // Đúng hạn
            document.getElementById("month-ontime-val").textContent = `${monthStats.onTimeRate || 0}%`;

            // Dự báo KPI
            const kpiResult = calculateKpiScore(monthStats);
            const kpiScoreEl = document.getElementById("month-kpi-score");
            if (kpiScoreEl) {
                kpiScoreEl.innerHTML = `
                    <span>${kpiResult.totalScore}/5.0</span>
                    <span class="kpi-score-badge ${kpiResult.badge.class}">${kpiResult.badge.icon} ${kpiResult.badge.text}</span>
                `;
            }

            // Tiến trình tháng (chuẩn 192h)
            const monthSpent = parseFloat(monthStats.totalSpent) || 0;
            const monthTarget = monthStats.workingHours || 192;
            const monthProgress = Math.min((monthSpent / monthTarget) * 100, 100);
            document.getElementById("month-spent-total").textContent = `${monthSpent}h / ${monthTarget}h`;
            document.getElementById("month-progress-fill").style.width = `${monthProgress}%`;
        }
    }

    async function fetchUserProfile(token) {
        const res = await fetch(`https://gitlab.widosoft.com/api/v4/user`, { headers: { 'PRIVATE-TOKEN': token } });
        const response = await res.json();

        if (response.message == '401 Unauthorized') {
            return null;
        }

        await saveUserProfile(response);
        return response;
    }


    async function saveUserProfile(userProfile) {
        await chrome.storage.local.set({ ['UserProfile']: userProfile });
    }


    async function addAccessToken(accessToken) {
        await chrome.storage.local.set({ ['AccessToken']: accessToken });
    }

    chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        const usedKB = (bytesInUse / 1024).toFixed(2);
        const maxKB = (chrome.storage.local.QUOTA_BYTES / 1024).toFixed(0);
        const storageProgress = Math.min((bytesInUse / chrome.storage.local.QUOTA_BYTES) * 100, 100);

        document.getElementById("used-bytes").textContent = usedKB + ' KB';
        document.getElementById("max-bytes").textContent = (maxKB / 1024).toFixed(1) + ' MB';
        const storageFill = document.getElementById("storage-fill");
        if (storageFill) storageFill.style.width = `${storageProgress}%`;
    });
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openNoteWindow,
        openNoteTab,
        openTodoWindow,
        openTodoTab
    };
}

