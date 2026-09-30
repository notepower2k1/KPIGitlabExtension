/**
 * Core i18n Engine & Complete Multilingual Dictionaries (VI / EN)
 * GitLab Productivity Extension
 */

const I18N_DICTIONARIES = {
    vi: {
        // --- Language Switcher ---
        langVi: "Tiếng Việt",
        langEn: "English",
        langSwitcherTitle: "Đổi ngôn ngữ giao diện",

        // --- Navigation & Tabs ---
        tabWeek: "📅 Tuần",
        tabMonth: "📊 Tháng",
        tabTools: "🛠️ Công cụ",
        tabHome: "Trang chủ",
        tabNotes: "Ghi chú",
        tabTodo: "Việc cần làm",
        tabWorkItems: "Chi tiết công việc",
        tabAnalytics: "Phân tích & Biểu đồ Tháng",

        // --- Auth & Login ---
        welcomeTitle: "Chào bạn 👋",
        welcomeDesc: "Nhập Personal Access Token để bắt đầu",
        tokenPlaceholder: "Nhập Personal Access Token...",
        connectBtn: "Kết nối ngay",
        tutorialBtn: "Hướng dẫn sử dụng",
        logoutBtn: "Đăng xuất",
        tokenRequired: "Vui lòng nhập token",
        connectSuccess: "Kết nối thành công!",
        connectFailed: "Token không hợp lệ!",
        invalidToken: "Token không hợp lệ hoặc đã hết hạn",

        // --- Banner & Unadded Tasks ---
        unaddedBannerTitle: "Bạn có {count} task tạo hôm nay chưa thêm vào KPI!",
        viewDetails: "Chi tiết ▼",
        hideDetails: "Thu gọn ▲",
        addAllToKpi: "➕ Thêm tất cả vào KPI",
        addSingleTask: "+ Thêm",
        addedSuccess: "✔ Đã thêm",
        alreadyAdded: "Đã tồn tại trong KPI",

        // --- Popup Stats Cards ---
        statsWeekTitle: "⭐ Thống kê tuần",
        statsMonthTitle: "⭐ Thống kê tháng",
        statTotalTasks: "Tổng Task",
        statEstimate: "Estimate",
        statSpent: "Spent",
        progressWeek: "Tiến trình tuần:",
        progressDaily: "Tiến trình ngày:",
        progressMonth: "Tiến trình tháng:",
        metricOnTime: "Đúng hạn",
        metricKpiForecast: "Dự báo KPI",

        // --- Check-in / Out Card & Settings ---
        storageTitle: "📦 Bộ nhớ",
        checkinCardTitle: "⏰ Nhắc Check-in / Out",
        workdayBadge: "T2 - T6",
        checkinLabel: "Check-in",
        checkoutLabel: "Check-out",
        kpiReminderLabel: "Nhắc KPI cuối ngày",
        kpiReminderTooltip: "Tự động quét và cảnh báo các task tạo hôm nay chưa thêm vào KPI trước giờ check-out",
        kpiReminderBefore: "Trước:",
        minutesUnit: "phút",
        snoozeLabel: "Nhắc lại:",
        snooze5m: "Mỗi 5 phút (Tối đa 3 lần)",
        snooze10m: "Mỗi 10 phút (Tối đa 3 lần)",
        snooze15m: "Mỗi 15 phút (Tối đa 3 lần)",
        snoozeNone: "Không nhắc lại",
        urlLabel: "Link chấm công:",
        urlPlaceholder: "https://chamcong.congty.com...",
        testSoundBtn: "🔔 Thử chuông",
        testSoundTooltip: "Bấm để thử thông báo ngay lập tức",
        saveSettingsBtn: "💾 Lưu",
        saveSettingsSuccess: "✔ Đã lưu cài đặt!",

        // --- Tools Grid & Quick Links ---
        noteWindowBtn: "Ghi chú (Cửa sổ) 🗗",
        noteTabBtn: "Ghi chú (Tab) 📑",
        todoWindowBtn: "Việc cần làm (Cửa sổ) 🗗",
        todoTabBtn: "Việc cần làm (Tab) 📑",
        exportBtn: "Xuất dữ liệu 💿",
        importBtn: "Nhập dữ liệu 📀",
        importSuccess: "Nhập dữ liệu thành công!",
        importError: "Đọc file thất bại hoặc file không hợp lệ.",
        quickGitlabTitle: "🦊 Mở nhanh trên GitLab",
        quickIssuesBtn: "📋 Issues",
        quickIssuesTooltip: "Issues được giao cho bạn",
        quickMRsBtn: "🚀 MRs",
        quickMRsTooltip: "Merge Requests của bạn",
        quickTodosBtn: "📝 To-Do",
        quickTodosTooltip: "Việc cần làm trên GitLab",
        openDashboardBtn: "Mở Dashboard 📊",

        // --- Kanban Board ---
        kanbanTitle: "📋 Kanban Board",
        totalTodoActive: "{count} công việc đang thực hiện",
        windowModeBtn: "🗗 Cửa sổ rời",
        tabModeBtn: "📑 Mở dạng Tab",
        modeSwitchTooltip: "Chuyển đổi chế độ cửa sổ",
        clearAllBtn: "Xóa tất cả",
        confirmClearAll: "Bạn có chắc muốn xóa tất cả công việc?",
        addTaskPlaceholder: "Việc cần làm là gì? (Nhấn Enter để thêm)",
        deadlinePlaceholder: "Hạn chót",
        reminderSettingsTooltip: "Cài đặt nhắc việc",
        reminderBeforeLabel: "⏰ Trước (phút):",
        reminderRepeatLabel: "🔁 Lặp (phút):",
        saveReminderSettingsTooltip: "Lưu cài đặt nhắc việc",
        addTaskBtn: "➕ Thêm công việc",
        colTodo: "CẦN LÀM",
        colProcessing: "ĐANG LÀM",
        colDone: "HOÀN THÀNH",
        editTaskModalTitle: "Chỉnh sửa công việc",
        taskNameLabel: "Tên công việc:",
        deadlineLabel: "Hạn chót:",
        cancelBtn: "Hủy",
        saveChangesBtn: "Lưu thay đổi",
        deleteTaskBtn: "Xóa",

        // --- Notepad ---
        notesTitle: "Notepad - Ghi chú cá nhân",
        untitledNote: "Ghi chú {index}",
        closeTabTooltip: "Đóng tab",
        newTabTooltip: "Thêm tab mới (+)",
        addNoteBtn: "+",
        deleteNoteBtn: "×",
        privacyTooltip: "Bật/Tắt che mờ riêng tư",
        copyAllTooltip: "Sao chép toàn bộ ghi chú",
        copiedTooltip: "Đã sao chép!",
        themeToggleTooltip: "Đổi giao diện Sáng / Tối",
        notePlaceholder: "Bắt đầu ghi chú...",
        autoSaved: "Đã lưu ✔",
        saving: "Đang lưu...",
        wordsCount: "{count} từ",
        charsCount: "{count} ký tự",

        // --- KPI Dashboard ---
        pageTitle: "GitLab Productivity 📊",
        deleteWeekBtn: "🗑️ Xóa tuần",
        deleteWeekTooltip: "Xóa toàn bộ Task và Merge Request trong tuần đang chọn",
        deleteMonthBtn: "🗑️ Xóa tháng",
        deleteMonthTooltip: "Xóa toàn bộ Task và Merge Request trong tháng đang chọn",
        exportWeekKpiBtn: "📅 Xuất KPI tuần",
        exportWeekKpiTooltip: "Xuất danh sách task và MR của tuần ra file Excel",
        exportMonthKpiBtn: "📊 Xuất KPI Tháng",
        exportMonthKpiTooltip: "Xuất báo cáo KPI đầy đủ của tháng ra file Excel",
        statsBtn: "📊 Thống kê",
        statsTooltip: "Thống kê dữ liệu KPI",
        dailyReportBtn: "📋 Xuất Daily report",
        dailyReportTooltip: "Sao chép báo cáo daily 3 phần",
        monthSelectLabel: "🗓️ Chọn Tháng",
        timeFilterSelectLabel: "📅 Lọc theo Tuần / Ngày",
        filterWeek: "Tuần này",
        filterMonth: "Tháng này",
        filterAll: "Tất cả",
        customRangeFrom: "Từ ngày",
        customRangeTo: "Đến ngày",
        applyRangeBtn: "🔍 Áp dụng",
        tabWorkItemsTitle: "Chi tiết công việc",
        tabAnalyticsTitle: "Phân tích & Biểu đồ Tháng",
        quickControlsTitle: "Tìm kiếm & Lọc nhanh",
        quickControlsTooltip: "Bấm để mở rộng / thu gọn bộ lọc",
        searchPlaceholder: "Tìm kiếm theo tên task, #iid, URL, issue cha, dự án...",
        clearSearchTooltip: "Xóa tìm kiếm",
        openFilteredTabsBtn: "🌐 Mở tab",
        openFilteredTabsTooltip: "Mở các task đang lọc trong danh sách trên các tab mới",
        chipAll: "Tất cả",
        chipMR: "🚀 Merge Requests",
        chipLate: "🔴 Trễ hạn",
        chipMissingTime: "⚠️ Thiếu Est/Spent",
        chipMissingDate: "📅 Thiếu Ngày",
        chipReopen: "🔄 Bị Reopen",
        chipUnplanned: "⚡ Phát sinh",
        chipOpen: "⏳ Đang mở",
        kpiHealthScore: "Dự Báo Điểm KPI & Sức Khỏe Hiệu Suất",
        kpiHealthAssessmentPeriod: "Kỳ đánh giá:",
        kpiHealthScoreScale: "Dự báo điểm KPI (Thang 5.0)",
        attitudeScore: "Thái độ",
        volumeScore: "Khối lượng",
        qualityScore: "Chất lượng",
        onTimeRate: "Tỉ lệ đúng hạn",
        hoursProgressTitle: "⌛ Tiến độ giờ làm việc",
        hoursStandardTarget: "tiêu chuẩn",
        hoursPlanned: "Kế hoạch:",
        hoursUnplanned: "Phát sinh:",
        healthAlertsTitle: "🛡️ Sức khỏe KPI & Lối tắt xử lý",
        tableTasks: "Tasks",
        tableWorkItemName: "Tên Work Item",
        tableParentIssue: "Issue cha",
        tableStartDate: "Start date",
        tableDueDate: "Due date",
        tableClosedDate: "Closed date",
        tableEst: "Estimate (h)",
        tableSpent: "Spent (h)",
        tableDiff: "Chênh lệch",
        tableReopen: "Số lần bị reopen",
        tableTaskType: "Loại task",
        tableProgress: "Tiến độ",
        tableStatus: "Trạng thái",
        tableAction: "Thao tác",
        statusDoing: "Đang làm",
        statusDone: "Hoàn thành",
        statusCarryOver: "Tồn đọng",
        statusLate: "Trễ hạn",
        statusInTime: "Đúng hạn",
        timesheetTitle: "Bảng Kiểm Tra Log Time Hàng Ngày",
        timesheetSubtitle: "Định mức chuẩn 8.0h/ngày làm việc (Thứ 2 - Thứ 6)",
        timesheetStandardHours: "Giờ chuẩn",
        timesheetOvertime: "Tăng ca",
        timesheetLate: "Đi muộn / Thiếu giờ",
        timesheetLogged: "Thời gian đã log:",
        timesheetTarget: "Chỉ tiêu ngày:",
        chartWeeklyEstSpentTitle: "Ước tính vs Thực tế theo Tuần (Estimate vs Spent)",
        chartWeeklyEstSpentSub: "So sánh tổng giờ kế hoạch và thực tế theo từng tuần",
        chartTaskTypeTitle: "Cơ cấu Kế hoạch vs Phát sinh (Planned vs Unplanned)",
        chartTaskTypeSub: "Tỷ lệ công việc dự kiến và ngoài dự kiến",
        chartTaskStatusTitle: "Tình trạng Công việc (In-time / Late / Open)",
        chartTaskStatusSub: "Tỷ lệ công việc đúng hạn, trễ hạn và đang mở",
        chartKpiTrendTitle: "Xu hướng Điểm KPI qua các Tuần",
        chartKpiTrendSub: "Biến thiên điểm KPI trung bình tuần trong tháng",
        modalDayTitle: "Chi tiết ngày làm việc",
        leaveSettingTitle: "🏖️ Thiết lập ngày nghỉ phép / Nghỉ lễ:",
        leaveDayNormal: "💼 Ngày làm việc bình thường (Chỉ tiêu 8h)",
        leaveDayHalf: "🌓 Nghỉ nửa ngày (0.5 ngày - Chỉ tiêu 4h)",
        leaveDayFull: "🏖️ Nghỉ cả ngày (1.0 ngày - Chỉ tiêu 0h)",
        leaveReasonLabel: "Lý do nghỉ (tùy chọn):",
        leaveReasonPlaceholder: "VD: Nghỉ phép năm, khám bệnh, việc cá nhân, nghỉ lễ...",
        saveLeaveBtn: "💾 Lưu thiết lập ngày",
        recordedTasksTitle: "📋 Công việc đã ghi nhận trong ngày ({count}):",

        // --- GitLab In-Page Summary ---
        summaryBtn: "📊 Tổng hợp task",
        summaryBtnTooltip: "Tổng hợp task con của tôi",
        summaryModalTitle: "📊 Tổng hợp Task con của tôi",
        syncingFromGitlab: "Đang đồng bộ số liệu mới nhất từ GitLab...",
        addAllToKpiModal: "➕ Thêm tất cả vào KPI",
        refreshBtn: "🔄 Làm mới",
        metricTotalTasks: "Tổng Task",
        metricClosedTasks: "{count} đóng",
        metricOpenTasks: "{count} mở",
        metricTotalEst: "Tổng Estimate",
        metricTotalSpent: "Tổng Spent",
        metricPlannedTasks: "{count} kế hoạch",
        metricUnplannedTasks: "{count} phát sinh",
        metricDiff: "Chênh lệch",
        diffSurplus: "Dư thời gian",
        diffExceeded: "Vượt Estimate",
        metricOnTimeRate: "Đúng hạn",
        allOnTime: "100% đúng hạn",
        lateTasksCount: "{count} task trễ",
        searchTaskPlaceholder: "🔍 Tìm kiếm theo tên hoặc #id task...",
        showingTasksCount: "Hiển thị {shown} / {total} task",
        tableHeaderTask: "Task",
        tableHeaderEst: "Estimate",
        tableHeaderSpent: "Spent",
        tableHeaderDiff: "Chênh lệch",
        tableHeaderStart: "Bắt đầu",
        tableHeaderDue: "Hạn chót",
        tableHeaderCreated: "Ngày mở",
        tableHeaderClosed: "Ngày đóng",
        tableHeaderStatus: "Trạng thái",
        tableHeaderProgress: "Tiến độ",
        tableHeaderType: "Phân loại",
        tableHeaderKpi: "KPI",
        btnAddSingleToKpi: "➕ Thêm vào KPI",
        btnAddedToKpi: "✔ Đã thêm vào KPI",

        // --- Desktop Notifications ---
        notifCheckinTitle: "🔔 Nhắc nhở chấm công vào ca",
        notifCheckinMsg: "Đã đến giờ bắt đầu làm việc ({time}). Nhấn vào đây để mở link chấm công!",
        notifCheckoutTitle: "🔔 Nhắc nhở chấm công về",
        notifCheckoutMsg: "Đã đến giờ kết thúc ca làm ({time}). Nhấn vào đây để mở link chấm công!",
        notifKpiAlertTitle: "⚠️ Nhắc nhở KPI cuối ngày",
        notifKpiAlertMsg: "Bạn có {count} task tạo hôm nay chưa thêm vào KPI! Nhấn vào đây để kiểm tra ngay.",
        notifTodoReminderTitle: "🔔 Nhắc nhở công việc",
        notifTodoReminderMsg: "👉 \"{title}\" {status} lúc {time}",
        notifTodoOverdue: "đã quá hạn",
        notifTodoUpcoming: "sắp đến hạn",
        notifTestSoundTitle: "🔔 Kiểm tra chuông nhắc việc",
        notifTestSoundMsgUrl: "Thông báo hoạt động tốt! Nhấn vào đây để thử mở link chấm công.",
        notifTestSoundMsgNoUrl: "Thông báo hoạt động tốt! Bạn có thể lưu lại cài đặt."
    },

    en: {
        // --- Language Switcher ---
        langVi: "Tiếng Việt",
        langEn: "English",
        langSwitcherTitle: "Switch interface language",

        // --- Navigation & Tabs ---
        tabWeek: "📅 Week",
        tabMonth: "📊 Month",
        tabTools: "🛠️ Tools",
        tabHome: "Home",
        tabNotes: "Notes",
        tabTodo: "To-Do",
        tabWorkItems: "Work Items",
        tabAnalytics: "Monthly Analytics & Charts",

        // --- Auth & Login ---
        welcomeTitle: "Welcome 👋",
        welcomeDesc: "Enter Personal Access Token to get started",
        tokenPlaceholder: "Enter Personal Access Token...",
        connectBtn: "Connect Now",
        tutorialBtn: "User Guide",
        logoutBtn: "Log out",
        tokenRequired: "Please enter a token",
        connectSuccess: "Connected successfully!",
        connectFailed: "Invalid Token!",
        invalidToken: "Token is invalid or expired",

        // --- Banner & Unadded Tasks ---
        unaddedBannerTitle: "You have {count} task(s) created today not yet added to KPI!",
        viewDetails: "Details ▼",
        hideDetails: "Collapse ▲",
        addAllToKpi: "➕ Add All to KPI",
        addSingleTask: "+ Add",
        addedSuccess: "✔ Added",
        alreadyAdded: "Already added to KPI",

        // --- Popup Stats Cards ---
        statsWeekTitle: "⭐ Weekly Stats",
        statsMonthTitle: "⭐ Monthly Stats",
        statTotalTasks: "Total Tasks",
        statEstimate: "Estimate",
        statSpent: "Spent",
        progressWeek: "Weekly Progress:",
        progressDaily: "Daily Progress:",
        progressMonth: "Monthly Progress:",
        metricOnTime: "On-Time",
        metricKpiForecast: "KPI Forecast",

        // --- Check-in / Out Card & Settings ---
        storageTitle: "📦 Storage",
        checkinCardTitle: "⏰ Check-in / Out Alerts",
        workdayBadge: "Mon - Fri",
        checkinLabel: "Check-in",
        checkoutLabel: "Check-out",
        kpiReminderLabel: "End-of-day KPI Reminder",
        kpiReminderTooltip: "Automatically scan and alert about tasks created today not yet added to KPI before check-out",
        kpiReminderBefore: "Before:",
        minutesUnit: "min",
        snoozeLabel: "Snooze:",
        snooze5m: "Every 5 min (Max 3 times)",
        snooze10m: "Every 10 min (Max 3 times)",
        snooze15m: "Every 15 min (Max 3 times)",
        snoozeNone: "Do not snooze",
        urlLabel: "Attendance URL:",
        urlPlaceholder: "https://attendance.company.com...",
        testSoundBtn: "🔔 Test Bell",
        testSoundTooltip: "Click to test notification immediately",
        saveSettingsBtn: "💾 Save",
        saveSettingsSuccess: "✔ Settings saved!",

        // --- Tools Grid & Quick Links ---
        noteWindowBtn: "Notes (Window) 🗗",
        noteTabBtn: "Notes (Tab) 📑",
        todoWindowBtn: "To-Do (Window) 🗗",
        todoTabBtn: "To-Do (Tab) 📑",
        exportBtn: "Export Data 💿",
        importBtn: "Import Data 📀",
        importSuccess: "Data imported successfully!",
        importError: "Failed to read file or invalid format.",
        quickGitlabTitle: "🦊 Quick Access on GitLab",
        quickIssuesBtn: "📋 Issues",
        quickIssuesTooltip: "Issues assigned to you",
        quickMRsBtn: "🚀 MRs",
        quickMRsTooltip: "Your Merge Requests",
        quickTodosBtn: "📝 To-Do",
        quickTodosTooltip: "To-Do items on GitLab",
        openDashboardBtn: "Open Dashboard 📊",

        // --- Kanban Board ---
        kanbanTitle: "📋 Kanban Board",
        totalTodoActive: "{count} active task(s)",
        windowModeBtn: "🗗 Pop-out Window",
        tabModeBtn: "📑 Open in Tab",
        modeSwitchTooltip: "Toggle window mode",
        clearAllBtn: "Clear All",
        confirmClearAll: "Are you sure you want to clear all tasks?",
        addTaskPlaceholder: "What needs to be done? (Press Enter to add)",
        deadlinePlaceholder: "Deadline",
        reminderSettingsTooltip: "Reminder settings",
        reminderBeforeLabel: "⏰ Before (min):",
        reminderRepeatLabel: "🔁 Repeat (min):",
        saveReminderSettingsTooltip: "Save reminder settings",
        addTaskBtn: "➕ Add Task",
        colTodo: "TO DO",
        colProcessing: "IN PROGRESS",
        colDone: "DONE",
        editTaskModalTitle: "Edit Task",
        taskNameLabel: "Task Name:",
        deadlineLabel: "Deadline:",
        cancelBtn: "Cancel",
        saveChangesBtn: "Save Changes",
        deleteTaskBtn: "Delete",

        // --- Notepad ---
        notesTitle: "Notepad - Personal Notes",
        untitledNote: "Note {index}",
        closeTabTooltip: "Close tab",
        newTabTooltip: "Add new tab (+)",
        addNoteBtn: "+",
        deleteNoteBtn: "×",
        privacyTooltip: "Toggle privacy blur",
        copyAllTooltip: "Copy entire note",
        copiedTooltip: "Copied!",
        themeToggleTooltip: "Toggle Light / Dark mode",
        notePlaceholder: "Start typing notes here...",
        autoSaved: "Saved ✔",
        saving: "Saving...",
        wordsCount: "{count} word(s)",
        charsCount: "{count} character(s)",

        // --- KPI Dashboard ---
        pageTitle: "GitLab Productivity 📊",
        deleteWeekBtn: "🗑️ Delete Week",
        deleteWeekTooltip: "Delete all Tasks and Merge Requests in selected week",
        deleteMonthBtn: "🗑️ Delete Month",
        deleteMonthTooltip: "Delete all Tasks and Merge Requests in selected month",
        exportWeekKpiBtn: "📅 Export Weekly KPI",
        exportWeekKpiTooltip: "Export weekly tasks and MRs to Excel",
        exportMonthKpiBtn: "📊 Export Monthly KPI",
        exportMonthKpiTooltip: "Export full monthly KPI report to Excel",
        statsBtn: "📊 Calculate Stats",
        statsTooltip: "Compute KPI statistics",
        dailyReportBtn: "📋 Export Daily Report",
        dailyReportTooltip: "Copy 3-part daily report",
        monthSelectLabel: "🗓️ Select Month",
        timeFilterSelectLabel: "📅 Filter by Week / Day",
        filterWeek: "This Week",
        filterMonth: "This Month",
        filterAll: "All",
        customRangeFrom: "From date",
        customRangeTo: "To date",
        applyRangeBtn: "🔍 Apply",
        tabWorkItemsTitle: "Work Items Detail",
        tabAnalyticsTitle: "Monthly Analytics & Charts",
        quickControlsTitle: "Quick Search & Filters",
        quickControlsTooltip: "Click to expand / collapse filters",
        searchPlaceholder: "Search by task name, #iid, URL, parent issue, project...",
        clearSearchTooltip: "Clear search",
        openFilteredTabsBtn: "🌐 Open Tabs",
        openFilteredTabsTooltip: "Open filtered tasks in new browser tabs",
        chipAll: "All",
        chipMR: "🚀 Merge Requests",
        chipLate: "🔴 Overdue",
        chipMissingTime: "⚠️ Missing Est/Spent",
        chipMissingDate: "📅 Missing Dates",
        chipReopen: "🔄 Reopened",
        chipUnplanned: "⚡ Unplanned",
        chipOpen: "⏳ Open",
        kpiHealthScore: "KPI Score Forecast & Performance Health",
        kpiHealthAssessmentPeriod: "Evaluation period:",
        kpiHealthScoreScale: "KPI Score Forecast (5.0 Scale)",
        attitudeScore: "Attitude",
        volumeScore: "Volume",
        qualityScore: "Quality",
        onTimeRate: "On-Time Rate",
        hoursProgressTitle: "⌛ Working Hours Progress",
        hoursStandardTarget: "standard",
        hoursPlanned: "Planned:",
        hoursUnplanned: "Unplanned:",
        healthAlertsTitle: "🛡️ KPI Health & Quick Fixes",
        tableTasks: "Tasks",
        tableWorkItemName: "Work Item Name",
        tableParentIssue: "Parent Issue",
        tableStartDate: "Start date",
        tableDueDate: "Due date",
        tableClosedDate: "Closed date",
        tableEst: "Estimate (h)",
        tableSpent: "Spent (h)",
        tableDiff: "Difference",
        tableReopen: "Reopen Count",
        tableTaskType: "Task Type",
        tableProgress: "Progress",
        tableStatus: "Status",
        tableAction: "Action",
        statusDoing: "Doing",
        statusDone: "Done",
        statusCarryOver: "Carry Over",
        statusLate: "Overdue",
        statusInTime: "In-time",
        timesheetTitle: "Daily Timesheet Audit",
        timesheetSubtitle: "Standard target 8.0h/workday (Monday - Friday)",
        timesheetStandardHours: "Standard Hours",
        timesheetOvertime: "Overtime",
        timesheetLate: "Under-logged / Late",
        timesheetLogged: "Logged time:",
        timesheetTarget: "Daily target:",
        chartWeeklyEstSpentTitle: "Weekly Estimate vs Spent",
        chartWeeklyEstSpentSub: "Comparison of planned and spent hours by week",
        chartTaskTypeTitle: "Planned vs Unplanned Task Composition",
        chartTaskTypeSub: "Ratio of planned versus unplanned work items",
        chartTaskStatusTitle: "Task Status Breakdown (In-time / Late / Open)",
        chartTaskStatusSub: "Ratio of in-time, overdue, and open tasks",
        chartKpiTrendTitle: "Weekly KPI Score Trend",
        chartKpiTrendSub: "Fluctuation of average weekly KPI score in the month",
        modalDayTitle: "Workday Details",
        leaveSettingTitle: "🏖️ Leave & Holiday Configuration:",
        leaveDayNormal: "💼 Normal workday (8.0h target)",
        leaveDayHalf: "🌓 Half-day leave (0.5 day - 4.0h target)",
        leaveDayFull: "🏖️ Full-day leave (1.0 day - 0.0h target)",
        leaveReasonLabel: "Leave reason (optional):",
        leaveReasonPlaceholder: "e.g. Annual leave, doctor visit, personal, public holiday...",
        saveLeaveBtn: "💾 Save Day Configuration",
        recordedTasksTitle: "📋 Recorded tasks for this day ({count}):",

        // --- GitLab In-Page Summary ---
        summaryBtn: "📊 Task Summary",
        summaryBtnTooltip: "Summary of my sub-tasks",
        summaryModalTitle: "📊 My Sub-Tasks Summary",
        syncingFromGitlab: "Syncing latest metrics from GitLab...",
        addAllToKpiModal: "➕ Add All to KPI",
        refreshBtn: "🔄 Refresh",
        metricTotalTasks: "Total Tasks",
        metricClosedTasks: "{count} closed",
        metricOpenTasks: "{count} open",
        metricTotalEst: "Total Estimate",
        metricTotalSpent: "Total Spent",
        metricPlannedTasks: "{count} planned",
        metricUnplannedTasks: "{count} unplanned",
        metricDiff: "Difference",
        diffSurplus: "Hours saved",
        diffExceeded: "Exceeded estimate",
        metricOnTimeRate: "On-time Rate",
        allOnTime: "100% on-time",
        lateTasksCount: "{count} overdue task(s)",
        searchTaskPlaceholder: "🔍 Search by task title or #id...",
        showingTasksCount: "Showing {shown} / {total} task(s)",
        tableHeaderTask: "Task",
        tableHeaderEst: "Estimate",
        tableHeaderSpent: "Spent",
        tableHeaderDiff: "Difference",
        tableHeaderStart: "Start Date",
        tableHeaderDue: "Due Date",
        tableHeaderCreated: "Created Date",
        tableHeaderClosed: "Closed Date",
        tableHeaderStatus: "Status",
        tableHeaderProgress: "Progress",
        tableHeaderType: "Classification",
        tableHeaderKpi: "KPI",
        btnAddSingleToKpi: "➕ Add to KPI",
        btnAddedToKpi: "✔ Added to KPI",

        // --- Desktop Notifications ---
        notifCheckinTitle: "🔔 Check-in Reminder",
        notifCheckinMsg: "It's time to start work ({time}). Click here to open attendance link!",
        notifCheckoutTitle: "🔔 Check-out Reminder",
        notifCheckoutMsg: "It's time to check out ({time}). Click here to open attendance link!",
        notifKpiAlertTitle: "⚠️ End-of-Day KPI Alert",
        notifKpiAlertMsg: "You have {count} task(s) created today not yet added to KPI! Click here to review.",
        notifTodoReminderTitle: "🔔 Task Reminder",
        notifTodoReminderMsg: "👉 \"{title}\" {status} at {time}",
        notifTodoOverdue: "is overdue",
        notifTodoUpcoming: "is due soon",
        notifTestSoundTitle: "🔔 Test Reminder Bell",
        notifTestSoundMsgUrl: "Notifications work great! Click here to test opening attendance link.",
        notifTestSoundMsgNoUrl: "Notifications work great! You can now save your settings."
    }
};

let currentLanguage = 'en';

/**
 * Detect browser preferred language. Defaults to 'vi' if starts with 'vi', otherwise 'en'.
 */
function detectBrowserLanguage() {
    try {
        if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
            const uiLang = chrome.i18n.getUILanguage();
            if (uiLang && typeof uiLang === 'string' && uiLang.toLowerCase().startsWith('vi')) {
                return 'vi';
            }
        }
    } catch (e) {
        // ignore
    }

    try {
        if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
            if (navigator.language.toLowerCase().startsWith('vi')) {
                return 'vi';
            }
        }
    } catch (e) {
        // ignore
    }

    return 'en';
}

/**
 * Returns currently active in-memory language code ('vi' | 'en').
 */
function getLanguage() {
    return currentLanguage || 'en';
}

/**
 * Sets active language, normalizes invalid inputs to 'en', and optionally persists to storage.
 * @param {string} lang - 'vi' | 'en'
 * @param {object} [storage] - Optional storage engine with .set({ appLanguage })
 */
async function setLanguage(lang, storage = null) {
    const normalized = (lang === 'vi' || lang === 'en') ? lang : 'en';
    currentLanguage = normalized;

    const targetStorage = storage || (typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null);
    if (targetStorage && typeof targetStorage.set === 'function') {
        try {
            const res = targetStorage.set({ appLanguage: normalized });
            if (res && typeof res.then === 'function') {
                await res;
            }
        } catch (e) {
            console.error('Failed to persist appLanguage:', e);
        }
    }
    return currentLanguage;
}

/**
 * Initializes language from storage if present, otherwise auto-detects from browser.
 * @param {object} [storage]
 */
async function initLanguage(storage = null) {
    const targetStorage = storage || (typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null);
    let storedLang = null;

    if (targetStorage && typeof targetStorage.get === 'function') {
        try {
            const data = await targetStorage.get(['appLanguage']);
            if (data && (data.appLanguage === 'vi' || data.appLanguage === 'en')) {
                storedLang = data.appLanguage;
            }
        } catch (e) {
            console.error('Failed to read appLanguage from storage:', e);
        }
    }

    if (!storedLang) {
        storedLang = detectBrowserLanguage();
    }

    currentLanguage = storedLang;
    return currentLanguage;
}

/**
 * Translates a key into current or specified language with optional placeholder substitution.
 * @param {string} key
 * @param {object} [params]
 * @param {string} [lang]
 */
function t(key, params = null, lang = null) {
    if (!key || typeof key !== 'string') return '';
    let targetLang = lang;
    let actualParams = params;
    // Support t(key, 'vi') overload where second argument is the language code
    if (typeof params === 'string') {
        targetLang = params;
        actualParams = null;
    }
    if (targetLang && typeof targetLang === 'string') {
        targetLang = targetLang.toLowerCase().startsWith('vi') ? 'vi' : 'en';
    } else {
        targetLang = getLanguage();
    }
    const dict = I18N_DICTIONARIES[targetLang] || I18N_DICTIONARIES.en;
    let text = dict[key];

    // Fallback to English dictionary if key is missing in requested language
    if (text === undefined && targetLang !== 'en' && I18N_DICTIONARIES.en) {
        text = I18N_DICTIONARIES.en[key];
    }

    // Fallback to raw key if missing in both
    if (text === undefined) {
        return key;
    }

    if (actualParams && typeof actualParams === 'object') {
        return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, paramName) => {
            return actualParams[paramName] !== undefined ? String(actualParams[paramName]) : match;
        });
    }

    return text;
}

/**
 * Declaratively translates DOM elements having data-i18n* attributes.
 * @param {HTMLElement|Document} rootElement
 * @param {string} [lang]
 */
function applyI18n(rootElement, lang = null) {
    const root = rootElement || (typeof document !== 'undefined' ? document : null);
    if (!root) return;

    const targetLang = (lang === 'vi' || lang === 'en') ? lang : getLanguage();

    function translateElement(el) {
        if (!el || typeof el.getAttribute !== 'function') return;

        const textKey = el.getAttribute('data-i18n');
        if (textKey) {
            el.textContent = t(textKey, null, targetLang);
        }

        const placeholderKey = el.getAttribute('data-i18n-placeholder');
        if (placeholderKey) {
            el.placeholder = t(placeholderKey, null, targetLang);
        }

        const titleKey = el.getAttribute('data-i18n-title');
        if (titleKey) {
            el.title = t(titleKey, null, targetLang);
        }

        const ariaKey = el.getAttribute('data-i18n-aria');
        if (ariaKey && typeof el.setAttribute === 'function') {
            el.setAttribute('aria-label', t(ariaKey, null, targetLang));
        }
    }

    // Translate root element itself if it contains attributes
    translateElement(root);

    // Translate all descendants with data-i18n*
    if (typeof root.querySelectorAll === 'function') {
        const elements = root.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria]');
        elements.forEach(translateElement);
    }
}

// Initial detection
currentLanguage = detectBrowserLanguage();

// Bind to window for browser context
function _bindWindow(win) {
    if (!win) return;
    const i18nObj = {
        I18N_DICTIONARIES,
        t,
        detectBrowserLanguage,
        getLanguage,
        setLanguage,
        initLanguage,
        applyI18n,
        _bindWindow
    };
    win.i18n = i18nObj;
    win.t = t;
}

const globalScope = typeof window !== 'undefined'
    ? window
    : (typeof self !== 'undefined'
        ? self
        : (typeof globalThis !== 'undefined' ? globalThis : null));

if (globalScope) {
    _bindWindow(globalScope);
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        I18N_DICTIONARIES,
        t,
        detectBrowserLanguage,
        getLanguage,
        setLanguage,
        initLanguage,
        applyI18n,
        _bindWindow
    };
}
