/**
 * Background Service Worker for GitLab KPI Extension
 * Handles:
 *   1. Periodic to-do reminder notifications
 *   2. Workday check-in & check-out alert notifications with snooze & URL integration
 *   3. End-of-day unadded KPI tasks reminder with badge and desktop alert
 */

// --- Helper Integration for Utils & i18n ---
if (typeof importScripts === 'function') {
    try {
        importScripts('utils.js', 'i18n.js');
    } catch (e) {
        console.warn('Failed to importScripts:', e);
    }
} else if (typeof require !== 'undefined') {
    try {
        const u = require('./utils.js');
        // Assign helpers if not globally present
        if (typeof getTodayStartIso === 'undefined') global.getTodayStartIso = u.getTodayStartIso;
        if (typeof filterUnaddedTasks === 'undefined') global.filterUnaddedTasks = u.filterUnaddedTasks;
        if (typeof evaluateKpiReminderState === 'undefined') global.evaluateKpiReminderState = u.evaluateKpiReminderState;
        if (typeof fetchTodayCreatedIssues === 'undefined') global.fetchTodayCreatedIssues = u.fetchTodayCreatedIssues;
        if (typeof sanitizeGitlabUrl === 'undefined') global.sanitizeGitlabUrl = u.sanitizeGitlabUrl;
        if (typeof getGitlabServerUrl === 'undefined') global.getGitlabServerUrl = u.getGitlabServerUrl;

        const i18n = require('./i18n.js');
        if (typeof t === 'undefined') global.t = i18n.t;
        if (typeof detectBrowserLanguage === 'undefined') global.detectBrowserLanguage = i18n.detectBrowserLanguage;
        if (typeof getLanguage === 'undefined') global.getLanguage = i18n.getLanguage;
    } catch (e) {}
}

const _getTodayStartIso = (typeof getTodayStartIso === 'function') ? getTodayStartIso : ((typeof global !== 'undefined' && global.getTodayStartIso) || (typeof require !== 'undefined' && require('./utils.js').getTodayStartIso));
const _filterUnaddedTasks = (typeof filterUnaddedTasks === 'function') ? filterUnaddedTasks : ((typeof global !== 'undefined' && global.filterUnaddedTasks) || (typeof require !== 'undefined' && require('./utils.js').filterUnaddedTasks));
const _evaluateKpiReminderState = (typeof evaluateKpiReminderState === 'function') ? evaluateKpiReminderState : ((typeof global !== 'undefined' && global.evaluateKpiReminderState) || (typeof require !== 'undefined' && require('./utils.js').evaluateKpiReminderState));
const _fetchTodayCreatedIssues = (typeof fetchTodayCreatedIssues === 'function') ? fetchTodayCreatedIssues : ((typeof global !== 'undefined' && global.fetchTodayCreatedIssues) || (typeof require !== 'undefined' && require('./utils.js').fetchTodayCreatedIssues));
const _sanitizeGitlabUrl = (typeof sanitizeGitlabUrl === 'function') ? sanitizeGitlabUrl : ((typeof global !== 'undefined' && global.sanitizeGitlabUrl) || (typeof require !== 'undefined' && require('./utils.js').sanitizeGitlabUrl));
const _getGitlabServerUrl = (typeof getGitlabServerUrl === 'function') ? getGitlabServerUrl : ((typeof global !== 'undefined' && global.getGitlabServerUrl) || (typeof require !== 'undefined' && require('./utils.js').getGitlabServerUrl));
const _t = (typeof t === 'function') ? t : ((typeof global !== 'undefined' && global.t) || ((typeof require !== 'undefined') ? require('./i18n.js').t : (k => k)));
const _detectBrowserLanguage = (typeof detectBrowserLanguage === 'function') ? detectBrowserLanguage : ((typeof global !== 'undefined' && global.detectBrowserLanguage) || ((typeof require !== 'undefined') ? require('./i18n.js').detectBrowserLanguage : (() => 'en')));

function resolveLanguage(appLanguage) {
    if (appLanguage === 'vi' || appLanguage === 'en') return appLanguage;
    if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
        return (typeof _detectBrowserLanguage === 'function') ? _detectBrowserLanguage() : 'en';
    }
    return 'vi';
}

// --- Check-in & Check-out Helper Functions ---

function isWorkday(date) {
    const d = date || new Date();
    const day = d.getDay(); // 0: Sunday, 6: Saturday
    return day >= 1 && day <= 5;
}

function sanitizeAttendanceUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
        return 'https://' + trimmed;
    }
    return trimmed;
}

function evaluateAlertState(now, settings, state = {}) {
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let curState = { ...state };
    if (curState.lastDate !== todayDateStr) {
        curState = {
            lastDate: todayDateStr,
            count: 0,
            done: false,
            lastNotified: null
        };
    }

    if (!settings.enabled || !settings.targetTime || curState.done) {
        return { shouldNotify: false, nextState: curState };
    }

    const maxRepeats = settings.maxRepeats || 3;
    if (curState.count >= maxRepeats) {
        return { shouldNotify: false, nextState: curState };
    }

    const [targetHour, targetMinute] = settings.targetTime.split(':').map(Number);
    const targetTotalMins = targetHour * 60 + targetMinute;
    const currentTotalMins = now.getHours() * 60 + now.getMinutes();

    if (currentTotalMins < targetTotalMins) {
        return { shouldNotify: false, nextState: curState };
    }

    // Initial alert
    if (curState.count === 0) {
        // Allow initial notification within a 60-minute window
        if (currentTotalMins - targetTotalMins <= 60) {
            return {
                shouldNotify: true,
                isSnooze: false,
                repeatIndex: 0,
                nextState: {
                    ...curState,
                    count: 1,
                    lastNotified: now.toISOString()
                }
            };
        }
        return { shouldNotify: false, nextState: curState };
    }

    // Snooze repeat alerts
    const snoozeMinutes = Number(settings.snoozeMinutes);
    if (!snoozeMinutes || snoozeMinutes <= 0) {
        return { shouldNotify: false, nextState: curState };
    }

    if (!curState.lastNotified) {
        return { shouldNotify: false, nextState: curState };
    }

    const lastNotifiedTime = new Date(curState.lastNotified).getTime();
    const minsSinceLast = (now.getTime() - lastNotifiedTime) / (60 * 1000);

    if (minsSinceLast >= snoozeMinutes) {
        return {
            shouldNotify: true,
            isSnooze: true,
            repeatIndex: curState.count,
            nextState: {
                ...curState,
                count: curState.count + 1,
                lastNotified: now.toISOString()
            }
        };
    }

    return { shouldNotify: false, nextState: curState };
}

async function checkCheckInOutAlerts(now = new Date()) {
    if (!isWorkday(now)) return;

    const data = await chrome.storage.local.get([
        'checkInEnabled',
        'checkInTime',
        'checkOutEnabled',
        'checkOutTime',
        'checkInOutSnoozeMinutes',
        'checkInOutUrl',
        'checkInState',
        'checkOutState',
        'appLanguage'
    ]);

    const lang = resolveLanguage(data.appLanguage);

    const checkInSettings = {
        enabled: data.checkInEnabled !== false,
        targetTime: data.checkInTime || '08:30',
        snoozeMinutes: Number(data.checkInOutSnoozeMinutes ?? 5),
        maxRepeats: 3
    };

    const checkOutSettings = {
        enabled: data.checkOutEnabled !== false,
        targetTime: data.checkOutTime || '18:00',
        snoozeMinutes: Number(data.checkInOutSnoozeMinutes ?? 5),
        maxRepeats: 3
    };

    let updatedCheckInState = data.checkInState || {};
    let updatedCheckOutState = data.checkOutState || {};
    let stateChanged = false;

    // 1. Evaluate Check-in
    const inEval = evaluateAlertState(now, checkInSettings, updatedCheckInState);
    if (inEval.nextState.lastDate !== updatedCheckInState.lastDate || inEval.shouldNotify) {
        stateChanged = true;
    }
    updatedCheckInState = inEval.nextState;

    if (inEval.shouldNotify) {
        const title = _t('notifCheckinTitle', null, lang);
        const message = _t('notifCheckinMsg', { time: checkInSettings.targetTime }, lang);

        chrome.notifications.create('checkin-alert', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icon48.png'),
            title: title,
            message: message,
            priority: 2,
            requireInteraction: true
        });
    }

    // 2. Evaluate Check-out
    const outEval = evaluateAlertState(now, checkOutSettings, updatedCheckOutState);
    if (outEval.nextState.lastDate !== updatedCheckOutState.lastDate || outEval.shouldNotify) {
        stateChanged = true;
    }
    updatedCheckOutState = outEval.nextState;

    if (outEval.shouldNotify) {
        const title = _t('notifCheckoutTitle', null, lang);
        const message = _t('notifCheckoutMsg', { time: checkOutSettings.targetTime }, lang);

        chrome.notifications.create('checkout-alert', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icon48.png'),
            title: title,
            message: message,
            priority: 2,
            requireInteraction: true
        });
    }

    if (stateChanged) {
        await chrome.storage.local.set({
            checkInState: updatedCheckInState,
            checkOutState: updatedCheckOutState
        });
    }
}

// --- Dynamic Content Script Registration for Custom GitLab Domains ---

async function syncDynamicContentScript(serverUrl) {
    if (typeof chrome === 'undefined' || !chrome.scripting) {
        return false;
    }
    let targetUrl = serverUrl;
    if (!targetUrl && typeof _getGitlabServerUrl === 'function') {
        try {
            targetUrl = await _getGitlabServerUrl();
        } catch (e) {
            targetUrl = 'https://gitlab.com';
        }
    }
    const sanitized = _sanitizeGitlabUrl ? _sanitizeGitlabUrl(targetUrl || 'https://gitlab.com') : (targetUrl || 'https://gitlab.com');

    // Unregister existing custom dynamic scripts first to avoid duplication
    try {
        if (typeof chrome.scripting.unregisterContentScripts === 'function') {
            await chrome.scripting.unregisterContentScripts({ ids: ['custom-gitlab-scripts', 'custom-gitlab-mr-scripts'] });
        }
    } catch (e) {
        // Ignored if not previously registered
    }

    try {
        const parsed = new URL(sanitized);
        const origin = parsed.origin;
        const hostname = parsed.hostname.toLowerCase();

        // Static domains already covered in manifest.json
        if (hostname === 'gitlab.com' || hostname === 'gitlab.widosoft.com') {
            return true;
        }

        // Custom domain: register content scripts
        if (typeof chrome.scripting.registerContentScripts === 'function') {
            await chrome.scripting.registerContentScripts([
                {
                    id: 'custom-gitlab-scripts',
                    matches: [
                        `${origin}/*/-/issues/*`,
                        `${origin}/*/-/work_items/*`
                    ],
                    js: ['utils.js', 'i18n.js', 'content_issue.js'],
                    runAt: 'document_idle'
                },
                {
                    id: 'custom-gitlab-mr-scripts',
                    matches: [
                        `${origin}/*/-/merge_requests/*`
                    ],
                    js: ['utils.js', 'content_request.js'],
                    runAt: 'document_idle'
                }
            ]);
        }
        return true;
    } catch (err) {
        console.error('Error syncing dynamic content script:', err);
        return false;
    }
}

// --- End-of-Day Unadded KPI Tasks Helper Function ---

async function checkUnaddedKpiTasksReminder(now = new Date(), customFetch = null) {
    const data = await chrome.storage.local.get([
        'AccessToken',
        'checkOutTime',
        'checkOutEnabled',
        'kpiReminderEnabled',
        'kpiReminderMinutesBefore',
        'kpiReminderState',
        'WorkItemIds',
        'gitlabServerUrl',
        'gitlabUrl',
        'appLanguage'
    ]);

    const lang = resolveLanguage(data.appLanguage);

    const settings = {
        enabled: data.kpiReminderEnabled !== false,
        checkOutTime: data.checkOutTime || '18:00',
        minutesBefore: Number(data.kpiReminderMinutesBefore ?? 15)
    };

    const currentState = data.kpiReminderState || {};
    const evalResult = _evaluateKpiReminderState(now, settings, currentState);

    // Always persist day rollover reset if date changed
    if (evalResult.nextState && evalResult.nextState.lastDate !== currentState.lastDate) {
        await chrome.storage.local.set({
            kpiReminderState: {
                lastDate: evalResult.nextState.lastDate,
                count: 0,
                done: false,
                lastNotified: null
            }
        });
    }

    if (!evalResult.shouldScan) {
        return;
    }

    if (!data.AccessToken) {
        return;
    }

    const todayStartIso = _getTodayStartIso(now);
    const rawGitlabUrl = data.gitlabServerUrl || data.gitlabUrl || 'https://gitlab.com';
    const gitlabUrl = _sanitizeGitlabUrl ? _sanitizeGitlabUrl(rawGitlabUrl) : rawGitlabUrl;
    const apiIssues = await _fetchTodayCreatedIssues(data.AccessToken, gitlabUrl, todayStartIso, customFetch);
    const unaddedTasks = _filterUnaddedTasks(apiIssues, data.WorkItemIds || []);

    if (unaddedTasks.length > 0) {
        await chrome.storage.local.set({ UnaddedTodayTasks: unaddedTasks });

        if (chrome.action && chrome.action.setBadgeText) {
            chrome.action.setBadgeText({ text: '!' });
            if (chrome.action.setBadgeBackgroundColor) {
                chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
            }
        }

        if (evalResult.shouldNotify) {
            const title = _t('notifKpiAlertTitle', null, lang);
            const message = _t('notifKpiAlertMsg', { count: unaddedTasks.length }, lang);
            chrome.notifications.create('kpi-unadded-alert', {
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icon48.png'),
                title: title,
                message: message,
                priority: 2,
                requireInteraction: true
            });
            // Only persist incremented notification count when notification is actually dispatched
            await chrome.storage.local.set({ kpiReminderState: evalResult.nextState });
        }
    } else {
        await chrome.storage.local.set({ UnaddedTodayTasks: [] });

        if (chrome.action && chrome.action.setBadgeText) {
            chrome.action.setBadgeText({ text: '' });
        }
    }
}

// --- Lifecycle Event Listeners ---

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(async () => {
        chrome.alarms.create("checkTodos", { periodInMinutes: 1 });

        // Cấu hình mặc định cho nhắc việc
        const defaults = await chrome.storage.local.get(['reminderMinutesBefore', 'reminderRepeatMinutes']);
        if (!defaults.reminderMinutesBefore) {
            await chrome.storage.local.set({
                reminderMinutesBefore: 30,
                reminderRepeatMinutes: 10,
                lastNotifiedMap: {}
            });
        }

        // Cấu hình mặc định cho Check-in & Check-out
        const checkInOutDefaults = await chrome.storage.local.get([
            'checkInEnabled',
            'checkInTime',
            'checkOutEnabled',
            'checkOutTime',
            'checkInOutSnoozeMinutes',
            'checkInOutUrl'
        ]);
        const toSet = {};
        if (checkInOutDefaults.checkInEnabled === undefined) toSet.checkInEnabled = true;
        if (!checkInOutDefaults.checkInTime) toSet.checkInTime = '08:30';
        if (checkInOutDefaults.checkOutEnabled === undefined) toSet.checkOutEnabled = true;
        if (!checkInOutDefaults.checkOutTime) toSet.checkOutTime = '18:00';
        if (checkInOutDefaults.checkInOutSnoozeMinutes === undefined) toSet.checkInOutSnoozeMinutes = 5;
        if (checkInOutDefaults.checkInOutUrl === undefined) toSet.checkInOutUrl = '';
        if (Object.keys(toSet).length > 0) {
            await chrome.storage.local.set(toSet);
        }

        // Cấu hình mặc định cho Nhắc nhở KPI chưa thêm cuối ngày
        const kpiDefaults = await chrome.storage.local.get([
            'kpiReminderEnabled',
            'kpiReminderMinutesBefore'
        ]);
        const kpiToSet = {};
        if (kpiDefaults.kpiReminderEnabled === undefined) kpiToSet.kpiReminderEnabled = true;
        if (kpiDefaults.kpiReminderMinutesBefore === undefined) kpiToSet.kpiReminderMinutesBefore = 15;
        if (Object.keys(kpiToSet).length > 0) {
            await chrome.storage.local.set(kpiToSet);
        }

        // Đồng bộ content script động cho domain GitLab tùy chỉnh
        const serverUrlData = await chrome.storage.local.get(['gitlabServerUrl']);
        if (serverUrlData && serverUrlData.gitlabServerUrl) {
            await syncDynamicContentScript(serverUrlData.gitlabServerUrl);
        }
    });
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(async () => {
        chrome.alarms.create("checkTodos", { periodInMinutes: 1 });
        const serverUrlData = await chrome.storage.local.get(['gitlabServerUrl']);
        if (serverUrlData && serverUrlData.gitlabServerUrl) {
            await syncDynamicContentScript(serverUrlData.gitlabServerUrl);
        }
    });
}

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area === 'local' && changes.gitlabServerUrl) {
            await syncDynamicContentScript(changes.gitlabServerUrl.newValue);
        }
    });
}

if (typeof chrome !== 'undefined' && chrome.alarms && chrome.alarms.onAlarm) {
    chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "checkTodos") return;

    // 1. Check To-Do Reminders
    const { todos = [], reminderMinutesBefore = 30, reminderRepeatMinutes = 10, lastNotifiedMap = {}, appLanguage } = await chrome.storage.local.get([
        'todos',
        'reminderMinutesBefore',
        'reminderRepeatMinutes',
        'lastNotifiedMap',
        'appLanguage'
    ]);
    const lang = resolveLanguage(appLanguage);

    const now = new Date();
    const updatedLastNotifiedMap = { ...lastNotifiedMap };

    todos.forEach(todo => {
        if (!todo.deadline || todo.status === 'done') return;

        const deadline = new Date(todo.deadline);
        const timeLeft = deadline - now;
        const minutesLeft = timeLeft / (60 * 1000);

        const lastNotifiedTime = updatedLastNotifiedMap[todo.id] ? new Date(updatedLastNotifiedMap[todo.id]) : null;
        const timeSinceLastNotification = lastNotifiedTime ? (now - lastNotifiedTime) / (60 * 1000) : Infinity;

        if (
            Math.abs(minutesLeft) <= reminderMinutesBefore &&
            timeSinceLastNotification >= reminderRepeatMinutes
        ) {
            const statusStr = minutesLeft < 0 ? _t('notifTodoOverdue', null, lang) : _t('notifTodoUpcoming', null, lang);
            const title = _t('notifTodoReminderTitle', null, lang);
            const message = _t('notifTodoReminderMsg', {
                title: todo.title,
                status: statusStr,
                time: deadline.toLocaleTimeString()
            }, lang);

            chrome.notifications.create(todo.id, {
                type: "basic",
                iconUrl: chrome.runtime.getURL('icon48.png'),
                title: title,
                message: message,
                priority: 2
            });

            updatedLastNotifiedMap[todo.id] = now.toISOString();
        }
    });

    await chrome.storage.local.set({ lastNotifiedMap: updatedLastNotifiedMap });

    // 2. Check Workday Check-in & Check-out Alerts
    await checkCheckInOutAlerts();

    // 3. Check End-of-Day Unadded KPI Tasks Reminder
    try {
        await checkUnaddedKpiTasksReminder();
    } catch (e) {
        console.error('Failed to check unadded KPI tasks reminder:', e);
    }
    });
}

// Notification click handler: opens attendance URL, KPI popup, or to-do page
async function handleNotificationClick(notifId) {
    if (!notifId || typeof notifId !== 'string') return;
    if (notifId === 'kpi-unadded-alert') {
        chrome.notifications.clear(notifId);
        if (chrome.action && typeof chrome.action.openPopup === 'function') {
            try {
                const res = chrome.action.openPopup();
                if (res && typeof res.then === 'function') {
                    await res;
                }
            } catch (err) {
                chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html') });
            }
        } else {
            chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html') });
        }
    } else if (notifId === 'checkin-alert' || notifId === 'checkout-alert' || notifId.startsWith('test-checkin-alert')) {
        const stateKey = notifId === 'checkin-alert' ? 'checkInState' : (notifId === 'checkout-alert' ? 'checkOutState' : null);
        const data = await chrome.storage.local.get(['checkInOutUrl', ...(stateKey ? [stateKey] : [])]);

        if (stateKey) {
            const curState = data[stateKey] || {};
            curState.done = true;
            await chrome.storage.local.set({ [stateKey]: curState });
        }

        chrome.notifications.clear(notifId);

        if (data.checkInOutUrl && data.checkInOutUrl.trim()) {
            const url = sanitizeAttendanceUrl(data.checkInOutUrl);
            if (url) {
                chrome.tabs.create({ url });
            }
        }
    } else {
        // To-do reminder notification clicked:
        chrome.notifications.clear(notifId);
        chrome.tabs.create({ url: chrome.runtime.getURL("todo/todo.html") });
    }
}

if (typeof chrome !== 'undefined' && chrome.notifications && chrome.notifications.onClicked) {
    chrome.notifications.onClicked.addListener(handleNotificationClick);
}

// Exports for Node testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isWorkday,
        sanitizeAttendanceUrl,
        evaluateAlertState,
        checkCheckInOutAlerts,
        handleNotificationClick,
        checkUnaddedKpiTasksReminder,
        syncDynamicContentScript
    };
}
