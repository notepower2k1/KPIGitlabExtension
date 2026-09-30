/**
 * Background Service Worker for GitLab KPI Extension
 * Handles:
 *   1. Periodic to-do reminder notifications
 *   2. Workday check-in & check-out alert notifications with snooze & URL integration
 */

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

async function checkCheckInOutAlerts() {
    const now = new Date();
    if (!isWorkday(now)) return;

    const data = await chrome.storage.local.get([
        'checkInEnabled',
        'checkInTime',
        'checkOutEnabled',
        'checkOutTime',
        'checkInOutSnoozeMinutes',
        'checkInOutUrl',
        'checkInState',
        'checkOutState'
    ]);

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
        const title = inEval.isSnooze
            ? `⏰ Nhắc nhở Check-in (Lần ${inEval.repeatIndex})`
            : `⏰ Đã đến giờ Check-in! (${checkInSettings.targetTime})`;
        const message = data.checkInOutUrl
            ? `Đừng quên chấm công buổi sáng nhé! Nhấn vào thông báo để mở link chấm công.`
            : `Đừng quên chấm công buổi sáng nhé! Chúc bạn một ngày làm việc hiệu quả!`;

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
        const title = outEval.isSnooze
            ? `👋 Nhắc nhở Check-out (Lần ${outEval.repeatIndex})`
            : `👋 Đã đến giờ Check-out! (${checkOutSettings.targetTime})`;
        const message = data.checkInOutUrl
            ? `Hết giờ làm việc rồi! Đừng quên checkout nhé. Nhấn vào thông báo để mở link chấm công.`
            : `Hết giờ làm việc rồi! Đừng quên checkout trước khi về nhé.`;

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
    });
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(() => {
        chrome.alarms.create("checkTodos", { periodInMinutes: 1 });
    });
}

if (typeof chrome !== 'undefined' && chrome.alarms && chrome.alarms.onAlarm) {
    chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "checkTodos") return;

    // 1. Check To-Do Reminders
    const { todos = [], reminderMinutesBefore = 30, reminderRepeatMinutes = 10, lastNotifiedMap = {} } = await chrome.storage.local.get([
        'todos',
        'reminderMinutesBefore',
        'reminderRepeatMinutes',
        'lastNotifiedMap'
    ]);

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
            chrome.notifications.create(todo.id, {
                type: "basic",
                iconUrl: chrome.runtime.getURL('icon48.png'),
                title: "🔔 Nhắc nhở công việc",
                message: `👉 "${todo.title}" ${minutesLeft < 0 ? "đã quá hạn" : "sắp đến hạn"} lúc ${deadline.toLocaleTimeString()}`,
                priority: 2
            });

            updatedLastNotifiedMap[todo.id] = now.toISOString();
        }
    });

    await chrome.storage.local.set({ lastNotifiedMap: updatedLastNotifiedMap });

    // 2. Check Workday Check-in & Check-out Alerts
    await checkCheckInOutAlerts();
    });
}

// Notification click handler: opens attendance URL or to-do page
async function handleNotificationClick(notifId) {
    if (notifId === 'checkin-alert' || notifId === 'checkout-alert' || notifId.startsWith('test-checkin-alert')) {
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
        handleNotificationClick
    };
}
