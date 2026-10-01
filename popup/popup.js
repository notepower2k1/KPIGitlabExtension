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

function batchAddTasksToWorkItemIds(tasksToAdd, currentWorkItemIds = []) {
    const existingList = Array.isArray(currentWorkItemIds) ? [...currentWorkItemIds] : [];
    const result = [...existingList];
    if (!Array.isArray(tasksToAdd)) return result;

    const checkIsAdded = (typeof isTaskAlreadyAdded === 'function')
        ? isTaskAlreadyAdded
        : (typeof window !== 'undefined' && typeof window.isTaskAlreadyAdded === 'function')
            ? window.isTaskAlreadyAdded
            : null;

    for (const task of tasksToAdd) {
        if (!task) continue;
        const taskId = String(task.id || task.iid || '').trim();
        const taskIid = task.iid ? String(task.iid).trim() : taskId;
        const taskHref = (task.href || task.web_url || '').trim();

        let alreadyExists = false;
        if (checkIsAdded) {
            alreadyExists = checkIsAdded(task, result);
        } else {
            alreadyExists = result.some(item => {
                if (!item) return false;
                const itemId = String(item.id || item.iid || '').trim();
                const itemIid = item.iid ? String(item.iid).trim() : '';
                const itemHref = (item.href || item.taskUrl || item.web_url || '').trim();

                if (taskHref && itemHref) {
                    const normP1 = itemHref.replace(/\/work_items\//, '/issues/').split('?')[0].replace(/\/+$/, '');
                    const normP2 = taskHref.replace(/\/work_items\//, '/issues/').split('?')[0].replace(/\/+$/, '');
                    if (normP1 === normP2) return true;
                    return false;
                }

                if (taskId && (itemId === taskId || (taskIid && itemId === taskIid))) return true;
                if (taskIid && (itemIid === taskIid || itemIid === taskId)) return true;

                return false;
            });
        }

        if (!alreadyExists) {
            const createdAt = task.createAt || task.createdAt || task.created_at || new Date().toISOString();
            result.push({
                id: taskId,
                iid: taskIid || taskId,
                href: taskHref,
                title: task.title || '',
                taskTitle: task.title || '',
                createAt: createdAt,
                addedAt: createdAt
            });
        }
    }
    return result;
}

function renderUnaddedKpiBanner(tasks, doc = (typeof document !== 'undefined' ? document : null), lang = null) {
    if (!doc) return;
    const banner = doc.getElementById('unaddedKpiBanner');
    const titleEl = doc.getElementById('unaddedKpiTitle');
    const listEl = doc.getElementById('unaddedKpiItemsList');

    if (!banner) return;

    let currentLang = 'vi';
    if (lang === 'vi' || lang === 'en') {
        currentLang = lang;
    } else if (typeof getLanguage === 'function') {
        currentLang = getLanguage();
    } else if (doc && doc.documentElement && typeof doc.documentElement.lang === 'string') {
        currentLang = doc.documentElement.lang.startsWith('en') ? 'en' : 'vi';
    }

    const _tr = (typeof t === 'function')
        ? t
        : ((typeof window !== 'undefined' && typeof window.t === 'function') ? window.t : null);

    if (Array.isArray(tasks) && tasks.length > 0) {
        banner.style.display = 'block';
        if (titleEl) {
            if (_tr) {
                titleEl.textContent = tasks.length === 1
                    ? (_tr('unaddedBannerTitleSingle', null, currentLang) || _tr('unaddedBannerTitle', { count: 1 }, currentLang))
                    : (_tr('unaddedBannerTitlePlural', { count: tasks.length }, currentLang) || _tr('unaddedBannerTitle', { count: tasks.length }, currentLang));
            } else {
                titleEl.textContent = `Bạn có ${tasks.length} task tạo hôm nay chưa thêm vào KPI!`;
            }
        }
        if (listEl) {
            listEl.innerHTML = '';
            const addBtnText = _tr ? _tr('addSingleTask', null, currentLang) : '+ Thêm';
            tasks.forEach(task => {
                const itemDiv = doc.createElement('div');
                itemDiv.className = 'unadded-kpi-item';

                const link = doc.createElement('a');
                link.className = 'unadded-kpi-item-title';
                link.href = task.href || '#';
                link.setAttribute('href', task.href || '#');
                link.target = '_blank';
                link.title = task.title || '';
                link.textContent = `#${task.iid || task.id} ${task.title || ''}`;

                const addBtn = doc.createElement('button');
                addBtn.className = 'unadded-kpi-add-btn';
                addBtn.type = 'button';
                addBtn.setAttribute('data-task-id', String(task.id));
                addBtn.textContent = addBtnText;

                itemDiv.appendChild(link);
                itemDiv.appendChild(addBtn);
                listEl.appendChild(itemDiv);
            });
        }
    } else {
        banner.style.display = 'none';
        const toggleBtn = doc.getElementById('toggleUnaddedListBtn');
        if (toggleBtn) {
            toggleBtn.textContent = _tr ? _tr('viewDetails', null, currentLang) : 'Chi tiết ▼';
        }
        if (listEl) listEl.style.display = 'none';
        if (typeof chrome !== 'undefined' && chrome.action && typeof chrome.action.setBadgeText === 'function') {
            chrome.action.setBadgeText({ text: '' });
        }
    }
}

let _utils = {};
if (typeof require === 'function') {
    try {
        _utils = require('../utils.js');
    } catch (e) {
        _utils = {};
    }
}

function _resolveSanitizeUrl() {
    if (typeof sanitizeGitlabUrl === 'function') return sanitizeGitlabUrl;
    if (typeof window !== 'undefined' && typeof window.sanitizeGitlabUrl === 'function') return window.sanitizeGitlabUrl;
    if (_utils && typeof _utils.sanitizeGitlabUrl === 'function') return _utils.sanitizeGitlabUrl;
    return (u, def = 'https://gitlab.com') => (u && typeof u === 'string' && u.trim()) ? u.trim() : def;
}

function _resolveGetTokenGenUrl() {
    if (typeof getTokenGenerationUrl === 'function') return getTokenGenerationUrl;
    if (typeof window !== 'undefined' && typeof window.getTokenGenerationUrl === 'function') return window.getTokenGenerationUrl;
    if (_utils && typeof _utils.getTokenGenerationUrl === 'function') return _utils.getTokenGenerationUrl;
    const sFn = _resolveSanitizeUrl();
    return (u) => `${sFn(u)}/-/user_settings/personal_access_tokens`;
}

function _resolveGetServerUrl() {
    if (typeof getGitlabServerUrl === 'function') return getGitlabServerUrl;
    if (typeof window !== 'undefined' && typeof window.getGitlabServerUrl === 'function') return window.getGitlabServerUrl;
    if (_utils && typeof _utils.getGitlabServerUrl === 'function') return _utils.getGitlabServerUrl;
    return async () => 'https://gitlab.com';
}

function updateTokenHelpLink(serverUrl, doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return;
    const sanitize = _resolveSanitizeUrl();
    const getTokenGen = _resolveGetTokenGenUrl();
    const sanitized = sanitize(serverUrl);
    const tokenHelpLink = doc.getElementById('tokenHelpLink');
    if (tokenHelpLink) {
        const genUrl = getTokenGen(sanitized);
        tokenHelpLink.href = genUrl;
        if (typeof tokenHelpLink.setAttribute === 'function') {
            tokenHelpLink.setAttribute('href', genUrl);
        }
    }
    const pills = doc.querySelectorAll ? doc.querySelectorAll('.quick-url-pill') : [];
    if (pills && pills.length) {
        pills.forEach(pill => {
            const pillUrl = pill.getAttribute ? pill.getAttribute('data-url') : '';
            if (pillUrl === sanitized) {
                if (pill.classList && pill.classList.add) pill.classList.add('active');
            } else {
                if (pill.classList && pill.classList.remove) pill.classList.remove('active');
            }
        });
    }
}

async function handleSaveServerUrl(rawUrl, storageArea = null) {
    const sanitize = _resolveSanitizeUrl();
    const sanitized = sanitize(rawUrl);
    const targetStorage = storageArea || (typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null);
    if (targetStorage && typeof targetStorage.set === 'function') {
        const res = targetStorage.set({ gitlabServerUrl: sanitized });
        if (res && typeof res.then === 'function') {
            await res;
        }
    }
    return sanitized;
}

async function saveUserProfile(userProfile) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ ['UserProfile']: userProfile });
    }
}

async function addAccessToken(accessToken) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ ['AccessToken']: accessToken });
    }
}

async function fetchUserProfile(token, serverUrl = 'https://gitlab.com', fetchFn = (typeof fetch !== 'undefined' ? fetch : null)) {
    if (!token) return null;
    const sanitize = _resolveSanitizeUrl();
    const baseUrl = sanitize(serverUrl);
    const doFetch = fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
    if (!doFetch) return null;

    try {
        const res = await doFetch(`${baseUrl}/api/v4/user`, {
            headers: { 'PRIVATE-TOKEN': token }
        });
        if (!res || !res.ok) {
            return null;
        }
        const response = await res.json();
        if (response && (response.message === '401 Unauthorized' || response.error)) {
            return null;
        }
        await saveUserProfile(response);
        return response;
    } catch (e) {
        return null;
    }
}

(async () => {
    if (typeof document === 'undefined') {
        return;
    }

    // Khởi tạo i18n
    let currentLang = 'vi';
    if (typeof initLanguage === 'function') {
        const storageLocal = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local : null;
        currentLang = await initLanguage(storageLocal);
    }
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = currentLang;
    }
    if (typeof applyI18n === 'function' && typeof document !== 'undefined') {
        applyI18n(document, currentLang);
    }
    syncLanguageUI(currentLang);

    function syncLanguageUI(lang) {
        document.querySelectorAll('.login-lang-switch .lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        const langSelect = document.getElementById('appLangSelect');
        if (langSelect && langSelect.value !== lang) {
            langSelect.value = lang;
        }
    }

    async function changeAppLanguage(newLang) {
        if (!newLang || (newLang !== 'vi' && newLang !== 'en')) return;
        const storageLocal = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local : null;
        if (typeof setLanguage === 'function') {
            await setLanguage(newLang, storageLocal);
        }
        currentLang = newLang;
        if (typeof document !== 'undefined' && document.documentElement) {
            document.documentElement.lang = newLang;
        }
        syncLanguageUI(newLang);
        if (typeof applyI18n === 'function' && typeof document !== 'undefined') {
            applyI18n(document, newLang);
        }
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            try {
                const data = await chrome.storage.local.get(['UnaddedTodayTasks']);
                renderUnaddedKpiBanner(data.UnaddedTodayTasks || [], document, newLang);
            } catch (e) {}
        }
    }

    // Gắn sự kiện cho nút chọn ngôn ngữ tại màn hình đăng nhập
    document.querySelectorAll('.login-lang-switch .lang-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetLang = btn.getAttribute('data-lang');
            await changeAppLanguage(targetLang);
        });
    });

    // Gắn sự kiện cho select ngôn ngữ tại tab cài đặt
    const appLangSelect = document.getElementById('appLangSelect');
    if (appLangSelect) {
        appLangSelect.value = currentLang;
        appLangSelect.addEventListener('change', async (e) => {
            await changeAppLanguage(e.target.value);
        });
    }

    syncLanguageUI(currentLang);

    // Lắng nghe thay đổi appLanguage qua storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(async (changes, area) => {
            if (area === 'local' && changes.appLanguage) {
                const newLang = changes.appLanguage.newValue;
                if (newLang && newLang !== currentLang) {
                    currentLang = newLang;
                    syncLanguageUI(newLang);
                    if (typeof applyI18n === 'function' && typeof document !== 'undefined') {
                        applyI18n(document, newLang);
                    }
                    const data = await chrome.storage.local.get(['UnaddedTodayTasks']);
                    renderUnaddedKpiBanner(data.UnaddedTodayTasks || [], document, newLang);
                }
            }
        });
    }

    // Khởi tạo Server URL và các liên kết
    const getServerUrlFn = _resolveGetServerUrl();
    const currentServerUrl = await getServerUrlFn();

    const loginServerUrlInput = document.getElementById('gitlabServerUrlInput');
    if (loginServerUrlInput) {
        loginServerUrlInput.value = currentServerUrl;
        loginServerUrlInput.addEventListener('input', (e) => {
            updateTokenHelpLink(e.target.value, document);
        });
        loginServerUrlInput.addEventListener('change', (e) => {
            updateTokenHelpLink(e.target.value, document);
        });
    }

    document.querySelectorAll('.quick-url-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const pillUrl = pill.getAttribute('data-url');
            if (pillUrl && loginServerUrlInput) {
                loginServerUrlInput.value = pillUrl;
                updateTokenHelpLink(pillUrl, document);
            }
        });
    });

    updateTokenHelpLink(currentServerUrl, document);

    // Cài đặt Server URL trong tab settings
    function initServerUrlSettings(initialUrl) {
        const settingsInput = document.getElementById('settingsServerUrlInput');
        const saveBtn = document.getElementById('saveServerUrlBtn');
        const saveMsg = document.getElementById('saveServerUrlMsg');

        if (settingsInput) {
            settingsInput.value = initialUrl;
        }

        if (saveBtn && !saveBtn._hasServerUrlListener) {
            saveBtn._hasServerUrlListener = true;
            saveBtn.addEventListener('click', async () => {
                const rawVal = settingsInput ? settingsInput.value : '';
                const sanitized = await handleSaveServerUrl(rawVal);
                if (settingsInput) {
                    settingsInput.value = sanitized;
                }
                if (loginServerUrlInput) {
                    loginServerUrlInput.value = sanitized;
                }
                updateTokenHelpLink(sanitized, document);

                if (saveMsg) {
                    const curL = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
                    saveMsg.textContent = (typeof t === 'function') ? t('serverUrlSaved', null, curL) : '✔ Đã lưu GitLab Server URL thành công';
                    saveMsg.style.display = 'block';
                    setTimeout(() => {
                        saveMsg.style.display = 'none';
                    }, 2500);
                }
            });
        }
    }
    initServerUrlSettings(currentServerUrl);

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
        const tokenInput = document.getElementById("token");
        const token = tokenInput ? tokenInput.value.trim() : '';
        const urlInput = document.getElementById("gitlabServerUrlInput");
        const rawServerUrl = urlInput ? urlInput.value : '';
        const sanitize = _resolveSanitizeUrl();
        const serverUrl = sanitize(rawServerUrl);

        if (!token) {
            alert(typeof t === 'function' ? t('tokenRequired') : "Vui lòng nhập token");
            return;
        }

        const user = await fetchUserProfile(token, serverUrl);
        if (user) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({ gitlabServerUrl: serverUrl });
            }
            await addAccessToken(token);
            renderUserProfile(user);
        } else {
            alert(typeof t === 'function' ? t('connectFailed') : "Token không hợp lệ!");
        }
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
        const getServerUrlFn = _resolveGetServerUrl();
        const serverUrl = await getServerUrlFn();
        const gitlabBaseUrl = serverUrl || 'https://gitlab.com';
        initServerUrlSettings(gitlabBaseUrl);

        const quickIssuesBtn = document.getElementById("quickIssuesBtn");
        const quickMRsBtn = document.getElementById("quickMRsBtn");
        const quickTodosBtn = document.getElementById("quickTodosBtn");

        if (quickIssuesBtn) {
            quickIssuesBtn.onclick = async () => {
                const currentServerUrl = await getServerUrlFn();
                const baseUrl = currentServerUrl || 'https://gitlab.com';
                const url = gitlabUsername
                    ? `${baseUrl}/dashboard/issues?assignee_username=${encodeURIComponent(gitlabUsername)}`
                    : `${baseUrl}/dashboard/issues`;
                chrome.tabs.create({ url });
            };
        }

        if (quickMRsBtn) {
            quickMRsBtn.onclick = async () => {
                const currentServerUrl = await getServerUrlFn();
                const baseUrl = currentServerUrl || 'https://gitlab.com';
                const url = gitlabUsername
                    ? `${baseUrl}/dashboard/merge_requests?assignee_username=${encodeURIComponent(gitlabUsername)}`
                    : `${baseUrl}/dashboard/merge_requests`;
                chrome.tabs.create({ url });
            };
        }

        if (quickTodosBtn) {
            quickTodosBtn.onclick = async () => {
                const currentServerUrl = await getServerUrlFn();
                const baseUrl = currentServerUrl || 'https://gitlab.com';
                chrome.tabs.create({ url: `${baseUrl}/dashboard/todos` });
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
            const kpiReminderEnabledEl = document.getElementById("kpiReminderEnabled");
            const kpiReminderMinutesBeforeEl = document.getElementById("kpiReminderMinutesBefore");
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
                'checkInOutUrl',
                'kpiReminderEnabled',
                'kpiReminderMinutesBefore'
            ]);

            if (settings.checkInEnabled !== undefined) checkInEnabledEl.checked = settings.checkInEnabled;
            if (settings.checkInTime) checkInTimeEl.value = settings.checkInTime;
            if (settings.checkOutEnabled !== undefined) checkOutEnabledEl.checked = settings.checkOutEnabled;
            if (settings.checkOutTime) checkOutTimeEl.value = settings.checkOutTime;
            if (settings.checkInOutSnoozeMinutes !== undefined) checkInOutSnoozeEl.value = String(settings.checkInOutSnoozeMinutes);
            if (settings.checkInOutUrl) checkInOutUrlEl.value = settings.checkInOutUrl;
            if (settings.kpiReminderEnabled !== undefined && kpiReminderEnabledEl) kpiReminderEnabledEl.checked = settings.kpiReminderEnabled;
            if (settings.kpiReminderMinutesBefore !== undefined && kpiReminderMinutesBeforeEl) kpiReminderMinutesBeforeEl.value = String(settings.kpiReminderMinutesBefore);

            // Xử lý lưu cài đặt
            saveBtn.addEventListener("click", async () => {
                const newSettings = {
                    checkInEnabled: checkInEnabledEl.checked,
                    checkInTime: checkInTimeEl.value || '08:30',
                    checkOutEnabled: checkOutEnabledEl.checked,
                    checkOutTime: checkOutTimeEl.value || '18:00',
                    checkInOutSnoozeMinutes: parseInt(checkInOutSnoozeEl.value, 10) || 0,
                    checkInOutUrl: checkInOutUrlEl.value.trim(),
                    kpiReminderEnabled: kpiReminderEnabledEl ? kpiReminderEnabledEl.checked : true,
                    kpiReminderMinutesBefore: kpiReminderMinutesBeforeEl ? (parseInt(kpiReminderMinutesBeforeEl.value, 10) || 15) : 15
                };

                await chrome.storage.local.set(newSettings);

                if (saveMsg) {
                    const curL = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
                    saveMsg.textContent = (typeof t === 'function') ? t('saveSettingsSuccess', null, curL) : "✔ Đã lưu cài đặt!";
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
                    const curL = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
                    const notifTitle = (typeof t === 'function')
                        ? t('notifTestSoundTitle', null, curL)
                        : "🔔 Kiểm tra chuông nhắc việc";
                    const notifMessage = url
                        ? ((typeof t === 'function')
                            ? t('notifTestSoundMsgUrl', null, curL)
                            : "Thông báo hoạt động tốt! Nhấn vào đây để thử mở link chấm công.")
                        : ((typeof t === 'function')
                            ? t('notifTestSoundMsgNoUrl', null, curL)
                            : "Thông báo hoạt động tốt! Bạn có thể lưu lại cài đặt.");

                    chrome.notifications.create(notifId, {
                        type: "basic",
                        iconUrl: chrome.runtime.getURL("icon48.png"),
                        title: notifTitle,
                        message: notifMessage,
                        priority: 2,
                        requireInteraction: true
                    });
                });
            }
        }

        await initCheckInOutSettings();

        // Khởi tạo UI cảnh báo task chưa thêm vào KPI
        async function initUnaddedKpiBannerUI() {
            const banner = document.getElementById("unaddedKpiBanner");
            if (!banner) return;

            const toggleBtn = document.getElementById("toggleUnaddedListBtn");
            const addAllBtn = document.getElementById("addAllUnaddedKpiBtn");
            const itemsList = document.getElementById("unaddedKpiItemsList");

            // Toggle chi tiết danh sách
            if (toggleBtn && itemsList) {
                toggleBtn.addEventListener("click", () => {
                    const isHidden = itemsList.style.display === "none" || !itemsList.style.display;
                    itemsList.style.display = isHidden ? "block" : "none";
                    const curL = (typeof getLanguage === 'function') ? getLanguage() : 'vi';
                    const hideText = (typeof t === 'function') ? t('hideDetails', null, curL) : "Thu gọn ▲";
                    const viewText = (typeof t === 'function') ? t('viewDetails', null, curL) : "Chi tiết ▼";
                    toggleBtn.textContent = isHidden ? hideText : viewText;
                });
            }

            // Nút Thêm tất cả vào KPI
            if (addAllBtn) {
                addAllBtn.addEventListener("click", async () => {
                    if (addAllBtn.disabled) return;
                    addAllBtn.disabled = true;
                    try {
                        const data = await chrome.storage.local.get(['UnaddedTodayTasks', 'WorkItemIds']);
                        const unadded = Array.isArray(data.UnaddedTodayTasks) ? data.UnaddedTodayTasks : [];
                        if (unadded.length === 0) return;

                        const currentWorkItems = Array.isArray(data.WorkItemIds) ? data.WorkItemIds : [];
                        const updatedWorkItems = batchAddTasksToWorkItemIds(unadded, currentWorkItems);

                        await chrome.storage.local.set({
                            WorkItemIds: updatedWorkItems,
                            UnaddedTodayTasks: []
                        });

                        if (typeof chrome !== 'undefined' && chrome.action && typeof chrome.action.setBadgeText === 'function') {
                            chrome.action.setBadgeText({ text: '' });
                        }
                        renderUnaddedKpiBanner([], document);
                    } finally {
                        addAllBtn.disabled = false;
                    }
                });
            }

            // Nút Thêm từng task (event delegation)
            if (itemsList) {
                itemsList.addEventListener("click", async (e) => {
                    const addBtn = e.target.closest(".unadded-kpi-add-btn");
                    if (!addBtn || addBtn.disabled) return;
                    addBtn.disabled = true;
                    try {
                        const taskId = addBtn.getAttribute("data-task-id");
                        if (!taskId) return;

                        const data = await chrome.storage.local.get(['UnaddedTodayTasks', 'WorkItemIds']);
                        const unadded = Array.isArray(data.UnaddedTodayTasks) ? data.UnaddedTodayTasks : [];
                        const taskToAdd = unadded.find(t => String(t.id) === String(taskId));
                        if (!taskToAdd) return;

                        const currentWorkItems = Array.isArray(data.WorkItemIds) ? data.WorkItemIds : [];
                        const updatedWorkItems = batchAddTasksToWorkItemIds([taskToAdd], currentWorkItems);
                        const remainingTasks = unadded.filter(t => String(t.id) !== String(taskId));

                        await chrome.storage.local.set({
                            WorkItemIds: updatedWorkItems,
                            UnaddedTodayTasks: remainingTasks
                        });

                        if (remainingTasks.length === 0) {
                            if (typeof chrome !== 'undefined' && chrome.action && typeof chrome.action.setBadgeText === 'function') {
                                chrome.action.setBadgeText({ text: '' });
                            }
                        }
                        renderUnaddedKpiBanner(remainingTasks, document);
                    } finally {
                        addBtn.disabled = false;
                    }
                });
            }

            // Lắng nghe thay đổi storage từ background service worker hoặc page content script
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
                chrome.storage.onChanged.addListener(async (changes, area) => {
                    if (area === 'local') {
                        if (changes.UnaddedTodayTasks) {
                            renderUnaddedKpiBanner(changes.UnaddedTodayTasks.newValue || [], document);
                        } else if (changes.WorkItemIds) {
                            const cur = await chrome.storage.local.get(['UnaddedTodayTasks']);
                            const tasks = Array.isArray(cur.UnaddedTodayTasks) ? cur.UnaddedTodayTasks : [];
                            const updatedWorkItems = Array.isArray(changes.WorkItemIds.newValue) ? changes.WorkItemIds.newValue : [];
                            const checkFn = (typeof isTaskAlreadyAdded === 'function')
                                ? isTaskAlreadyAdded
                                : (typeof window !== 'undefined' && typeof window.isTaskAlreadyAdded === 'function')
                                    ? window.isTaskAlreadyAdded
                                    : (t, list) => list.some(item => (item.id && String(item.id) === String(t.id)) || (item.href && item.href === t.href));
                            const stillUnadded = tasks.filter(t => !checkFn(t, updatedWorkItems));
                            if (stillUnadded.length !== tasks.length) {
                                await chrome.storage.local.set({ UnaddedTodayTasks: stillUnadded });
                                if (stillUnadded.length === 0 && chrome.action && typeof chrome.action.setBadgeText === 'function') {
                                    chrome.action.setBadgeText({ text: '' });
                                }
                                renderUnaddedKpiBanner(stillUnadded, document);
                            }
                        }
                    }
                });
            }

            // Tải trạng thái ban đầu từ storage
            const data = await chrome.storage.local.get(['UnaddedTodayTasks']);
            const unaddedTasks = Array.isArray(data.UnaddedTodayTasks) ? data.UnaddedTodayTasks : [];
            renderUnaddedKpiBanner(unaddedTasks, document);
        }

        await initUnaddedKpiBannerUI();

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

if (typeof window !== 'undefined') {
    window.batchAddTasksToWorkItemIds = batchAddTasksToWorkItemIds;
    window.renderUnaddedKpiBanner = renderUnaddedKpiBanner;
    window.updateTokenHelpLink = updateTokenHelpLink;
    window.handleSaveServerUrl = handleSaveServerUrl;
    window.fetchUserProfile = fetchUserProfile;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openNoteWindow,
        openNoteTab,
        openTodoWindow,
        openTodoTab,
        batchAddTasksToWorkItemIds,
        renderUnaddedKpiBanner,
        updateTokenHelpLink,
        handleSaveServerUrl,
        fetchUserProfile
    };
}

