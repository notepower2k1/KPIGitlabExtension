(async () => {
    console.log('Loading page.js');
    const today = new Date();

    const toIsoDate = dateStr => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    let allTaskInfo = [];
    let allDailyTaskInfo = [];

    let allMergeRequestInfo = [];

    const WORK_ITEM_KEY = 'WorkItemIds';
    const MERGE_ITEM_KEY = 'MergeItemIds';

    await getAllTasks();
    await getAllMergeRequest();

    if (allTaskInfo.length > 0) {
        await renderOldKpi();
    }

    const select = document.getElementById('weekdaySelect');
    const days = getCurrentWeekDates();

    days.forEach(({ label, value }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label.charAt(0).toUpperCase() + label.slice(1); // Viết hoa chữ cái đầu
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        const selectedDate = select.value;
        getAllTasks(selectedDate);
        getAllMergeRequest(selectedDate);
    });

    async function getAllTasks(filterDate = null) {

        const container = document.getElementById('allTaskContainer');
        container.innerHTML = ''; // Clear table mỗi lần render

        const storedItems = await getStoredIds(WORK_ITEM_KEY);

        const groups = {};
        allTaskInfo = []; // Reset lại mảng lưu thông tin

        storedItems.forEach(({ id, href, createAt }) => {
            const match = href.match(/gitlab\.widosoft\.com\/[^\/]+\/([^\/]+)\//);
            const groupName = match ? match[1] : 'Khác';

            if (!groups[groupName]) groups[groupName] = [];

            groups[groupName].push({ id, href });
            allTaskInfo.push({ href, id, groupName, createAt });
        });

        // Lọc theo ngày nếu có filterDate
        const filteredTasks = filterDate
            ? allTaskInfo.filter(task => toIsoDate(task.createAt) === filterDate)
            : allTaskInfo;

        if (filteredTasks.length === 0) {
            renderEmptyTable();
            checkAndDisableGetDetailBtn();
            return;
        } else {
            enableGetDetailBtn();
        };

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Group</th>
                    <th>Ngày tạo</th>
                    <th></th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        for (const taskInfo of filteredTasks) {
            const row = document.createElement('tr');

            const urlCell = document.createElement('td');
            const link = document.createElement('a');
            link.href = taskInfo.href;
            link.textContent = '#' + taskInfo.href.split('/').pop();
            link.title = taskInfo.href;
            link.target = '_blank';
            urlCell.appendChild(link);

            const groupNameCell = document.createElement('td');
            const groupLink = document.createElement('a');
            const newUrl = taskInfo.href.replace(/\/work_items\/\d+/, "/issues");
            groupLink.href = newUrl;
            groupLink.target = '_blank';
            groupLink.textContent = cleanGroupName(taskInfo.groupName);
            groupLink.style.fontSize = '0.75rem';
            groupNameCell.appendChild(groupLink);

            const createDateCell = document.createElement('td');
            createDateCell.textContent = taskInfo.createAt.split(',')[0]; // Chỉ hiện ngày, bỏ giờ
            createDateCell.style.fontSize = '0.75rem';

            const deleteCell = document.createElement('td');
            deleteCell.style.textAlign = 'right';
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '🗑️';
            deleteButton.title = 'Xóa';
            deleteButton.style.padding = '4px 8px';
            deleteButton.style.fontSize = '12px';
            deleteButton.className = 'btn-danger';

            deleteButton.addEventListener('click', async () => {
                await removeIdFromStorage(WORK_ITEM_KEY, taskInfo.id);
                row.remove();
                allTaskInfo = allTaskInfo.filter(item => item.id !== taskInfo.id);

                if (tbody.children.length === 0) {
                    table.remove();
                    renderEmptyTable();
                }
            });

            deleteCell.appendChild(deleteButton);

            row.appendChild(urlCell);
            row.appendChild(groupNameCell);
            row.appendChild(createDateCell);
            row.appendChild(deleteCell);
            tbody.appendChild(row);
        }

        container.appendChild(table);
    }


    async function getAllMergeRequest(filterDate = null) {

        const container = document.getElementById('allMergeRequestContainer');
        container.innerHTML = ''; // Clear table mỗi lần render

        const mergeRequestData = await getStoredIds(MERGE_ITEM_KEY);

        allMergeRequestInfo = [];

        mergeRequestData.forEach(({ id, href, createAt }) => {
            const match = href.match(/gitlab\.widosoft\.com\/[^\/]+\/([^\/]+)\//);
            const groupName = match ? match[1] : 'Khác';
            allMergeRequestInfo.push({ id, href, createAt, groupName });
        });

        // Lọc theo ngày nếu có filterDate
        const filteredTasks = filterDate
            ? allMergeRequestInfo.filter(item => toIsoDate(item.createAt) === filterDate)
            : allMergeRequestInfo;

        if (filteredTasks.length === 0) {
            renderEmptyMergeRequestTable();
            checkAndDisableGetDetailBtn();
            return;
        } else {
            enableGetDetailBtn();
        };

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Group</th>
                    <th>Ngày tạo</th>
                    <th></th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        for (const mergeRequestInfo of filteredTasks) {
            const row = document.createElement('tr');

            const urlCell = document.createElement('td');
            const link = document.createElement('a');
            link.href = mergeRequestInfo.href;
            link.textContent = '!' + mergeRequestInfo.href.split('/').pop(); // MR thường dùng dấu !
            link.title = mergeRequestInfo.href;
            link.target = '_blank';
            urlCell.appendChild(link);

            const groupNameCell = document.createElement('td');
            const groupLink = document.createElement('a');
            const newUrl = mergeRequestInfo.href.replace(/\/merge_requests\/\d+/, "/merge_requests");
            groupLink.href = newUrl;
            groupLink.target = '_blank';
            groupLink.textContent = cleanGroupName(mergeRequestInfo.groupName);
            groupLink.style.fontSize = '0.75rem';
            groupNameCell.appendChild(groupLink);

            const createDateCell = document.createElement('td');
            createDateCell.textContent = mergeRequestInfo.createAt.split(',')[0];
            createDateCell.style.fontSize = '0.75rem';

            const deleteCell = document.createElement('td');
            deleteCell.style.textAlign = 'right';
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '🗑️';
            deleteButton.title = 'Xóa';
            deleteButton.style.padding = '4px 8px';
            deleteButton.style.fontSize = '12px';
            deleteButton.className = 'btn-danger';

            deleteButton.addEventListener('click', async () => {
                await removeIdFromStorage(MERGE_ITEM_KEY, mergeRequestInfo.id);
                row.remove();
                allMergeRequestInfo = allMergeRequestInfo.filter(item => item.id !== mergeRequestInfo.id);

                if (tbody.children.length === 0) {
                    table.remove();
                    renderEmptyMergeRequestTable();
                }
            });

            deleteCell.appendChild(deleteButton);

            row.appendChild(urlCell);
            row.appendChild(groupNameCell);
            row.appendChild(createDateCell);
            row.appendChild(deleteCell);
            tbody.appendChild(row);
        }

        container.appendChild(table);
    }


    document.getElementById('getDetailBtn').addEventListener('click', async () => {
        const accessToken = getAccessToken();

        if (!accessToken) {
            alert('Chưa set access token');
            return;
        }

        document.getElementById('kpiContainer').innerHTML = '';
        document.getElementById('kpiStatsContainer').innerHTML = '';

        // Show loading spinner
        document.getElementById('spinner').style.display = 'block'; // Hiện loading

        console.log('Loading new data');

        const selectedDate = document.getElementById('weekdaySelect').value;

        // Filter tasks/MRs if date is selected
        const filteredTasks = selectedDate
            ? allTaskInfo.filter(task => toIsoDate(task.createAt) === selectedDate)
            : allTaskInfo;

        const filteredMRs = selectedDate
            ? allMergeRequestInfo.filter(mr => toIsoDate(mr.createAt) === selectedDate)
            : allMergeRequestInfo;

        const allItems = [...filteredTasks, ...filteredMRs];

        const kpiInfoPromises = allItems.map(({ createAt, href, id, groupName }) => {
            return getWorkItemDetailNew(createAt, href, groupName);
        });
        const kpiInfo = await Promise.all(kpiInfoPromises);

        if (kpiInfo.length === 0) {
            document.getElementById('spinner').style.display = 'none'; // Ẩn loading sau khi render xong
            document.getElementById('kpiContainer').innerHTML = ''; // Xóa nội dung cũ trước khi render
            return;
        }

        const lastUpdateTitle = document.createElement('h1');
        lastUpdateTitle.textContent = 'Lần thống kê cuối: ' + new Date().toLocaleString();

        if (isInPreviousWeek(new Date())) {
            lastUpdateTitle.textContent += ' (Tuần trước)';
            lastUpdateTitle.style.color = 'red';
        }

        document.getElementById('kpiContainer').appendChild(lastUpdateTitle);

        // Append divider
        const divider = document.createElement('div');
        divider.style.height = '1px';
        divider.style.width = '100%';
        divider.style.backgroundColor = 'gray';
        divider.style.margin = '10px 0';
        document.getElementById('kpiContainer').appendChild(divider);

        await renderKpi(kpiInfo, true);
        await saveKpiInfo(kpiInfo);

        document.getElementById('spinner').style.display = 'none'; // Ẩn loading sau khi render xong
    });

    document.getElementById('deleteAllTaskBtn').addEventListener('click', async () => {
        const confirmDelete = confirm('Xóa tất cả task?');

        if (!confirmDelete) {
            return;
        }

        const WORK_ITEM_KEY = 'WorkItemIds';
        allTaskInfo = [];
        await deletelocalStorage(WORK_ITEM_KEY);
        renderEmptyTable();
    });

    document.getElementById('exportCSVBtn').addEventListener('click', async () => {
        const container = document.getElementById('kpiContainer');

        if (container.innerHTML != '') {
            exportAllTablesToCSV();
        }
    })

    document.getElementById('getDailyTaskBtn').addEventListener('click', async () => {
        if (allDailyTaskInfo.length === 0) {
            alert('Chưa thống kê hoặc chưa có task nào trong ngày!!!');
            return;
        }

        let dailyTask = 'What did I do today?\n';

        // Group task theo groupName
        const groupedTasks = {};

        allDailyTaskInfo.forEach(item => {
            const groupName = cleanGroupName(item.groupName);
            if (!groupedTasks[groupName]) {
                groupedTasks[groupName] = [];
            }
            groupedTasks[groupName].push(item.title);
        });

        // Render report
        Object.entries(groupedTasks).forEach(([groupName, titles]) => {
            dailyTask += `\n- [${groupName}]\n`;
            titles.forEach(title => {
                dailyTask += `+ ${title} (Done)\n`;
            });
        });

        // copy to clipboard and show alert
        navigator.clipboard.writeText(dailyTask);
        alert('Daily task copied to clipboard');
    });

    async function renderKpi(kpiData, isSaveKpiStats = false) {
        const container = document.getElementById('kpiContainer');
        const selectedDate = document.getElementById('weekdaySelect').value;
        allDailyTaskInfo = [];

        // Các cột muốn hiển thị (bạn chỉnh theo đúng key trong kpiData nếu cần)
        const columns = ["Tasks", "Start date", "Due date", "Closed date", "Estimate (h)", "Spent (h)", "Số lần bị reopen", "Loại task", "Tiến độ"];
        const columnFieldMap = {
            "Tasks": "taskUrl",
            "Start date": "startDate",
            "Due date": "dueDate",
            "Closed date": "closeDate",
            "Estimate (h)": "estimate",
            "Spent (h)": "spent",
            "Số lần bị reopen": "reopenTotal",
            "Loại task": "type",
            "Tiến độ": "progress"
        };

        // Nhóm dữ liệu: Tasks theo groupName, MRs vào 1 nhóm riêng
        const taskGroups = {};
        const mrItems = [];


        const totalTask = kpiData.length;
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

        kpiData.forEach(item => {
            if (item.isMR) {
                mrItems.push(item);
            } else {
                const group = item.groupName || 'Khác';
                if (!taskGroups[group]) {
                    taskGroups[group] = [];
                }
                taskGroups[group].push(item);
            }

            if (item.type === 'Kế hoạch') {
                totalPlannedTask += 1;
                totalSpentPlannedTask += item.spent;
            }

            if (item.startDate == '') {
                totalTaskNoStartDate += 1;
            }

            if (item.dueDate == '') {
                totalTaskNoDueDate += 1;
            }

            if (item.estimate == 0) {
                totalTaskNoEstimate += 1;
            }

            if (item.spent == 0) {
                totalTaskNoSpent += 1;
            }

            if (item.progress === 'Đúng hạn') {
                totalTaskInTime += 1;
            }

            if (item.reopenTotal > 0) {
                reopenCount += 1;
            }

            const createdAt = toIsoDate(item.addedAt);
            const compareDateStr = selectedDate || toIsoDate(today);

            if (createdAt === compareDateStr) {
                dailySpentTime += item.spent;
                allDailyTaskInfo.push(item);
            }

            totalEstimate += item.estimate;
            totalSpent += item.spent;
        });

        // Với mỗi nhóm Task, tạo bảng riêng
        const taskColumns = ["Tasks", "Start date", "Due date", "Closed date", "Estimate (h)", "Spent (h)", "Số lần bị reopen", "Loại task", "Tiến độ"];

        for (const [groupName, items] of Object.entries(taskGroups)) {
            const section = document.createElement("div");
            section.className = "report-section";

            const groupTitle = document.createElement('h3');
            const urlLink = document.createElement('a');
            const firstItem = items[0];
            const newUrl = firstItem.taskUrl.replace(/\/work_items\/\d+/, "/issues");

            urlLink.href = newUrl;
            urlLink.target = '_blank';
            urlLink.textContent = cleanGroupName(groupName);
            groupTitle.appendChild(document.createTextNode("📁 "));
            groupTitle.appendChild(urlLink);
            section.appendChild(groupTitle);

            const table = document.createElement("table");
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            taskColumns.forEach(col => {
                const th = document.createElement("th");
                th.textContent = col;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            let groupTotalEstimate = 0;
            let groupTotalSpent = 0;
            let groupTotalReopen = 0;

            items.forEach(item => {
                groupTotalEstimate += item.estimate || 0;
                groupTotalSpent += item.spent || 0;
                groupTotalReopen += item.reopenTotal || 0;

                const row = document.createElement("tr");
                taskColumns.forEach(col => {
                    const td = document.createElement("td");
                    const key = columnFieldMap[col];
                    const value = item[key];

                    if (key === "taskUrl") {
                        const link = document.createElement('a');
                        link.href = value;
                        link.textContent = value.split('/').pop(); // Show just ID if long
                        link.title = value;
                        link.target = '_blank';
                        td.appendChild(link);
                    } else if (key === 'reopenTotal') {
                        td.textContent = value;
                        if (value > 0) td.classList.add('text-danger');
                    } else {
                        td.textContent = value !== undefined ? value : '';
                    }

                    if (key === 'type' || key === 'progress') {
                        if (value === 'Đúng hạn' || value === 'Kế hoạch') {
                            td.classList.add('text-success');
                        } else if (value === 'Phát sinh') {
                            td.classList.add('text-accent');
                        } else if (value === 'Trễ hạn') {
                            td.classList.add('text-danger');
                        }
                    }
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            const tfoot = document.createElement("tfoot");
            const totalRow = document.createElement("tr");
            const totalLabel = document.createElement("td");
            totalLabel.colSpan = taskColumns.length - 5;
            totalLabel.textContent = "TỔNG THEO GROUP";
            totalRow.appendChild(totalLabel);

            [groupTotalEstimate, groupTotalSpent, groupTotalReopen].forEach(val => {
                const td = document.createElement("td");
                td.textContent = val.toFixed(2);
                totalRow.appendChild(td);
            });

            tfoot.appendChild(totalRow);
            table.appendChild(tfoot);
            section.appendChild(table);
            container.appendChild(section);
        }

        // Render bảng Merge Request (nếu có)
        if (mrItems.length > 0) {
            const section = document.createElement("div");
            section.className = "report-section";

            const groupTitle = document.createElement('h3');
            groupTitle.textContent = "🚀 DANH SÁCH MERGE REQUEST";
            section.appendChild(groupTitle);

            const mrColumns = ["Tasks", "Estimate (h)", "Spent (h)"];
            const table = document.createElement("table");
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            mrColumns.forEach(col => {
                const th = document.createElement("th");
                th.textContent = col;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            let mrTotalEstimate = 0;
            let mrTotalSpent = 0;

            mrItems.forEach(item => {
                mrTotalEstimate += item.estimate || 0;
                mrTotalSpent += item.spent || 0;

                const row = document.createElement("tr");
                mrColumns.forEach(col => {
                    const td = document.createElement("td");
                    const key = columnFieldMap[col];
                    const value = item[key];

                    if (key === "taskUrl") {
                        const link = document.createElement('a');
                        link.href = value;
                        link.textContent = value.split('/').pop();
                        link.title = value;
                        link.target = '_blank';
                        td.appendChild(link);
                    } else {
                        td.textContent = value !== undefined ? value : '';
                    }
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            const tfoot = document.createElement("tfoot");
            const totalRow = document.createElement("tr");
            const totalLabel = document.createElement("td");
            totalLabel.colSpan = 1;
            totalLabel.textContent = "TỔNG MERGE REQUEST";
            totalRow.appendChild(totalLabel);

            [mrTotalEstimate, mrTotalSpent].forEach(val => {
                const td = document.createElement("td");
                td.textContent = val.toFixed(2);
                totalRow.appendChild(td);
            });

            tfoot.appendChild(totalRow);
            table.appendChild(tfoot);
            section.appendChild(table);
            container.appendChild(section);
        }

        const kpiStats = {
            totalTask: totalTask,
            totalPlannedTask: totalPlannedTask,
            totalUnplannedTask: totalTask - totalPlannedTask,
            totalTimeWorkingInCompany: 48, // Default value
            totalEstimate: parseFloat(totalEstimate).toFixed(2),
            totalSpent: parseFloat(totalSpent).toFixed(2),
            totalSpentPlannedTask: parseFloat(totalSpentPlannedTask).toFixed(2),
            totalSpentUnplannedTask: parseFloat(totalSpent - totalSpentPlannedTask).toFixed(2),
            totalTaskNoStartDate: totalTaskNoStartDate,
            totalTaskNoDueDate: totalTaskNoDueDate,
            totalTaskNoEstimate: totalTaskNoEstimate,
            totalTaskNoSpent: totalTaskNoSpent,
            totalTaskInTime: totalTaskInTime,
            totalTaskLate: totalTask - totalTaskInTime,
            totalTaskNotReopen: totalTask - reopenCount,
            totalTaskReopen: reopenCount,
            dailySpentTime: parseFloat(dailySpentTime).toFixed(2),
            lastUpdated: new Date().toLocaleString(),
        }

        if (isSaveKpiStats) {
            await saveKpiStats(kpiStats);
        }

        await renderKpiStats(kpiStats);
    }

    async function renderKpiStats(kpiStats) {
        const container = document.getElementById('kpiStatsContainer');
        container.innerHTML = '';

        const section = document.createElement("div");
        section.className = "report-section";

        const groupTitle = document.createElement('h3');
        groupTitle.textContent = "📈 TỔNG QUAN HIỆU SUẤT";
        section.appendChild(groupTitle);

        const statsData = [
            { label: "Tổng số task", value: kpiStats.totalTask },
            { label: "Kế hoạch / Phát sinh", value: `${kpiStats.totalPlannedTask} / ${kpiStats.totalUnplannedTask}` },
            { label: "Time Estimate", value: `${kpiStats.totalEstimate}h` },
            { label: "Time Spent", value: `${kpiStats.totalSpent}h` },
            { label: "Đúng hạn / Trễ hạn", value: `${kpiStats.totalTaskInTime} / ${kpiStats.totalTaskLate}` },
            { label: "Task Reopen", value: kpiStats.totalTaskReopen },
            { label: "Daily Spent", value: `${kpiStats.dailySpentTime}h` }
        ];

        const table = document.createElement("table");
        const tbody = document.createElement("tbody");

        statsData.forEach(stat => {
            const row = document.createElement("tr");
            const tdLabel = document.createElement("td");
            tdLabel.textContent = stat.label;
            tdLabel.style.fontWeight = "600";
            tdLabel.style.width = "40%";

            const tdValue = document.createElement("td");
            tdValue.textContent = stat.value;

            row.appendChild(tdLabel);
            row.appendChild(tdValue);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        section.appendChild(table);
        container.appendChild(section);
    }

    async function renderOldKpi() {
        const oldKpiInfo = await getStoredIds('KpiInfo');
        const oldKpiStats = await getStoredIds('KpiStats');
        const lastUpdatedTime = new Date(oldKpiStats.lastUpdated)

        if (oldKpiInfo.length > 0) {
            console.log('Loading old data');

            if (oldKpiInfo.length === 0) {
                return;
            }

            const lastUpdateTitle = document.createElement('h1');
            lastUpdateTitle.textContent = 'Lần thống kê cuối: ' + lastUpdatedTime.toLocaleString();

            if (isInPreviousWeek(lastUpdatedTime)) {
                lastUpdateTitle.textContent += ' (Tuần trước)';
                lastUpdateTitle.style.color = 'red';
            }

            document.getElementById('kpiContainer').appendChild(lastUpdateTitle);

            // Append divider
            const divider = document.createElement('div');
            divider.style.height = '1px';
            divider.style.width = '100%';
            divider.style.backgroundColor = 'gray';
            divider.style.margin = '10px 0';
            document.getElementById('kpiContainer').appendChild(divider);

            await renderKpi(oldKpiInfo);
            await renderKpiStats(oldKpiStats);
        }
    }

    function exportAllTablesToCSV() {
        const title = 'KPI_File'; // dùng làm tên file
        const container = document.getElementById('kpiContainer');
        const tables = container.querySelectorAll('table');
        const headers = container.querySelectorAll('h3');

        let csv = '';

        tables.forEach((table, index) => {
            const headerText = headers[index]?.innerText || `Table ${index + 1}`;
            csv += `### ${headerText}\n`; // ghi tên bảng trước mỗi bảng

            // Duyệt từng dòng trong bảng
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = Array.from(row.cells).map(cell => {
                    let text = cell.textContent.trim();
                    if (text.includes(',') || text.includes('"')) {
                        text = `"${text.replace(/"/g, '""')}"`; // escape dấu "
                    }
                    return text;
                });
                csv += cells.join(',') + '\n';
            });

            csv += '\n'; // dòng trắng giữa các bảng
        });

        // Tạo và tải file CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title}.csv`;
        link.click();
    }


    async function saveKpiInfo(params) {
        await chrome.storage.local.set({ ['KpiInfo']: params });
    }

    async function removeKpiInfo() {
        await chrome.storage.local.remove('KpiInfo');
    }

    async function saveKpiStats(params) {
        await chrome.storage.local.set({ ['KpiStats']: params });
    }

    async function getWorkItemDetailNew(createAt, projectUrl, groupName) {
        const parsedUrl = parseGitLabUrl(projectUrl);
        if (!parsedUrl) return null;

        const { projectPath, iid, type: itemType } = parsedUrl;
        const token = await getAccessToken();

        let detailData;
        if (itemType === 'merge_request') {
            detailData = await getMergeRequestDetail(token, projectPath, iid);
        } else {
            detailData = await getTaskDetail(token, projectPath, iid);
        }

        if (detailData) {
            const issuable = detailData.issuable || detailData.workItem;
            if (!issuable) return null;

            const closeDateFormat = (issuable.closedAt || issuable.mergedAt) ? new Date(issuable.closedAt || issuable.mergedAt).toISOString().slice(0, 10) : '';

            let esimateTimeTotal = 0;
            let spentTimeTotal = 0;
            let startDate = '';
            let dueDate = '';
            let taskType = "Kế hoạch";
            let assigneeId = null;
            let title = issuable.title;
            let webUrl = issuable.webUrl;

            if (itemType === 'merge_request') {
                esimateTimeTotal = issuable.timeEstimate;
                spentTimeTotal = issuable.totalTimeSpent;

                if (issuable.labels && issuable.labels.nodes) {
                    issuable.labels.nodes.forEach(label => {
                        if (label.title == "UNPLANNED") {
                            taskType = "Phát sinh";
                        }
                    });
                }
            } else {
                const widgets = issuable.widgets;

                // Start and due date
                const widgetStartDueDate = widgets.find(widget => widget.type === "START_AND_DUE_DATE");
                if (widgetStartDueDate) {
                    startDate = formatDate(widgetStartDueDate.startDate);
                    dueDate = widgetStartDueDate.dueDate;
                }

                // Time tracking widget
                const widgetTimeTracking = widgets.find(widget => widget.type === "TIME_TRACKING");
                if (widgetTimeTracking) {
                    esimateTimeTotal = widgetTimeTracking.timeEstimate;
                    spentTimeTotal = widgetTimeTracking.totalTimeSpent;
                }

                // Label widget
                const widgetLabel = widgets.find(widget => widget.type === "LABELS");
                if (widgetLabel) {
                    const labelNodes = widgetLabel.labels.nodes;
                    labelNodes.forEach(label => {
                        if (label.title == "UNPLANNED") {
                            taskType = "Phát sinh";
                        }
                    });
                }

                // Assignee widget
                const widgetAssinee = widgets.find(widget => widget.type === "ASSIGNEES");
                if (widgetAssinee && widgetAssinee.assignees.nodes.length > 0) {
                    assigneeId = widgetAssinee.assignees.nodes[0].id;
                }
            }

            let progressStatus = "Đúng hạn";
            if (closeDateFormat && dueDate) {
                progressStatus = compareDate(closeDateFormat, dueDate) >= 0 ? "Đúng hạn" : "Trễ hạn";
            }

            // Activity log (mainly for reopens, which we'll skip for MRs for now as it's complex)
            let reopenTotal = 0;
            if (itemType !== 'merge_request') {
                const taskNoteLogs = await getTaskActivityLog(token, projectPath, iid);
                if (taskNoteLogs && taskNoteLogs.workItem) {
                    const taskNoteLogWidget = taskNoteLogs.workItem.widgets.find(widget => widget.type === "NOTES")
                    if (taskNoteLogWidget) {
                        const taskNoteLogsList = taskNoteLogWidget.discussions.nodes;
                        taskNoteLogsList.forEach(noteLog => {
                            const noteDetails = noteLog.notes.nodes;
                            noteDetails.forEach(noteDetail => {
                                const noteAuthor = noteDetail.author;
                                if (noteDetail.body == 'reopened' && noteAuthor.id != assigneeId) {
                                    reopenTotal += 1;
                                }
                            })
                        })
                    }
                }
            }

            const returnData = {
                taskUrl: webUrl || projectUrl,
                startDate: startDate,
                dueDate: formatDate(dueDate),
                closeDate: formatDate(closeDateFormat),
                estimate: esimateTimeTotal ? parseFloat((esimateTimeTotal / 3600).toFixed(2)) : 0,
                spent: spentTimeTotal ? parseFloat((spentTimeTotal / 3600).toFixed(2)) : 0,
                reopenTotal: reopenTotal,
                type: taskType,
                progress: progressStatus,
                groupName: groupName,
                addedAt: createAt,
                title: title,
                isMR: itemType === 'merge_request'
            };

            return returnData;
        } else {
            return null;
        }

    }

    async function getTaskDetail(token, fullPath, iid) {
        const queryData = {
            operationName: "namespaceWorkItem",
            variables: {
                fullPath: `${fullPath}`, // fullPath,
                iid: `${iid}`, // iid
            },
            query: `
           query namespaceWorkItem($fullPath: ID!, $iid: String!) {
  workspace: namespace(fullPath: $fullPath) {
    id
    workItem(iid: $iid) {
      ...WorkItem
      __typename
    }
    __typename
  }
}

fragment WorkItem on WorkItem {
  id
  iid
  archived
  title
  state
  description
  confidential
  createdAt
  closedAt
  webUrl
  reference(full: true)
  createNoteEmail
  project {
    id
    __typename
  }
  namespace {
    id
    fullPath
    name
    fullName
    __typename
  }
  author {
    ...Author
    __typename
  }
  workItemType {
    id
    name
    iconName
    __typename
  }
  widgets {
    ...WorkItemWidgets
    __typename
  }
  __typename
}

fragment WorkItemWidgets on WorkItemWidget {
  type
  ... on WorkItemWidgetDescription {
    description
    descriptionHtml
    lastEditedAt
    lastEditedBy {
      name
      webPath
      __typename
    }
    taskCompletionStatus {
      completedCount
      count
      __typename
    }
    __typename
  }
  ... on WorkItemWidgetAssignees {
    allowsMultipleAssignees
    canInviteMembers
    assignees {
      nodes {
        ...User
        __typename
      }
      __typename
    }
    __typename
  }
  ... on WorkItemWidgetLabels {
    labels {
      nodes {
        ...Label
        __typename
      }
      __typename
    }
    __typename
  }
  ... on WorkItemWidgetStartAndDueDate {
    dueDate
    startDate
    __typename
  }
  ... on WorkItemWidgetTimeTracking {
    timeEstimate
    timelogs {
      nodes {
        ...TimelogFragment
        __typename
      }
      __typename
    }
    totalTimeSpent
    __typename
  }
  ... on WorkItemWidgetNotes {
    discussionLocked
    __typename
  }
  __typename
}

fragment Label on Label {
  id
  title
  description
  color
  textColor
  __typename
}

fragment User on User {
  id
  avatarUrl
  name
  username
  webUrl
  webPath
  __typename
}

fragment TimelogFragment on WorkItemTimelog {
  __typename
  id
  timeSpent
  user {
    id
    name
    __typename
  }
  spentAt
  note {
    id
    body
    __typename
  }
  summary
  userPermissions {
    adminTimelog
    __typename
  }
}

fragment Author on User {
  id
  avatarUrl
  name
  username
  webUrl
  webPath
  __typename
}

            `
        };

        const response = await fetch('https://gitlab.widosoft.com/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(queryData),
        });

        const res = await response.json();
        return res.data.workspace;
    }

    async function getTaskActivityLog(token, fullPath, iid) {
        const queryData = {
            operationName: "workItemNotesByIid",
            variables: {
                fullPath: `${fullPath}`, // fullPath,
                iid: `${iid}`, // iid
                pageSize: 40
            },
            query: `
            query workItemNotesByIid($fullPath: ID!, $iid: String!, $after: String, $pageSize: Int) {
  workspace: namespace(fullPath: $fullPath) {
    id
    workItem(iid: $iid) {
      id
      iid
      namespace {
        id
        __typename
      }
      widgets {
        ... on WorkItemWidgetNotes {
          type
          discussionLocked
          discussions(first: $pageSize, after: $after, filter: ALL_NOTES) {
            pageInfo {
              ...PageInfo
              __typename
            }
            nodes {
              id
              notes {
                nodes {
                  ...WorkItemNote
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}

fragment PageInfo on PageInfo {
  hasNextPage
  hasPreviousPage
  startCursor
  endCursor
  __typename
}

fragment WorkItemNote on Note {
  id
  body
  bodyHtml
  system
  internal
  systemNoteIconName
  createdAt
  lastEditedAt
  url
  authorIsContributor
  maxAccessLevelOfAuthor
  externalAuthor
  lastEditedBy {
    ...User
    webPath
    __typename
  }
  discussion {
    id
    resolved
    resolvable
    resolvedBy {
      id
      name
      __typename
    }
    __typename
  }
  author {
    ...User
    __typename
  }
  systemNoteMetadata {
    id
    __typename
  }
  __typename
}

fragment User on User {
  id
  avatarUrl
  name
  username
  webUrl
  webPath
  __typename
}
            `
        };
        const response = await fetch('https://gitlab.widosoft.com/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(queryData),
        });

        const res = await response.json();
        return res.data.workspace;
    }


    function renderEmptyTable() {
        const container = document.getElementById('allTaskContainer');
        container.innerHTML = '';

        const table = document.createElement('table');
        table.innerHTML = `
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Ngày tạo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="2" style="text-align:center; padding: 24px; color: var(--text-muted);">
                            Chưa có task nào
                        </td>
                    </tr>
                </tbody>
            `;
        container.appendChild(table);
    }

    function renderEmptyMergeRequestTable() {
        const container = document.getElementById('allMergeRequestContainer');
        container.innerHTML = '';

        const table = document.createElement('table');
        table.innerHTML = `
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Ngày tạo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="2" style="text-align:center; padding: 24px; color: var(--text-muted);">
                            Chưa có MR nào
                        </td>
                    </tr>
                </tbody>
            `;

        container.appendChild(table);
    }

    async function getMergeRequestDetail(token, fullPath, iid) {
        const queryData = {
            operationName: "mergeRequestTimeTracking",
            variables: {
                fullPath: `${fullPath}`,
                iid: `${iid}`,
            },
            query: `
query mergeRequestTimeTracking($fullPath: ID!, $iid: String!) {
  workspace: project(fullPath: $fullPath) {
    id
    issuable: mergeRequest(iid: $iid) {
      ...MergeRequestTimeTrackingFragment
      title
      state
      mergedAt
      closedAt
      webUrl
      humanTimeEstimate
      timeEstimate
      labels {
        nodes {
          title
        }
      }
      __typename
    }
    __typename
  }
}

fragment MergeRequestTimeTrackingFragment on MergeRequest {
  __typename
  id
  humanTotalTimeSpent
  totalTimeSpent
  timelogs {
    nodes {
      ...TimelogFragment
      __typename
    }
    __typename
  }
}

fragment TimelogFragment on Timelog {
  __typename
  id
  timeSpent
  user {
    id
    name
    __typename
  }
  spentAt
  note {
    id
    body
    __typename
  }
  summary
  userPermissions {
    adminTimelog
    __typename
  }
}
`
        };

        const response = await fetch('https://gitlab.widosoft.com/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(queryData),
        });

        const res = await response.json();
        return res.data.workspace;
    }

    function checkAndDisableGetDetailBtn() {
        const taskTbody = document.querySelector('#allTaskContainer tbody');
        const mrTbody = document.querySelector('#allMergeRequestContainer tbody');

        const isTasksEmpty = !taskTbody || taskTbody.innerText.includes('Chưa có task nào');
        const isMRsEmpty = !mrTbody || mrTbody.innerText.includes('Chưa có MR nào');

        if (isTasksEmpty && isMRsEmpty) {
            const btn = document.getElementById('getDetailBtn');
            btn.disabled = true;
            btn.classList.add('disabled-btn');
        }
    }

    function enableGetDetailBtn() {
        const btn = document.getElementById('getDetailBtn');
        btn.disabled = false;
        btn.classList.remove('disabled-btn');
    }

    function parseGitLabUrl(url) {
        const workItemMatch = url.match(/^https?:\/\/[^/]+\/(.+)\/-\/work_items\/(\d+)$/);
        if (workItemMatch) {
            return {
                type: 'work_item',
                projectPath: workItemMatch[1],
                iid: workItemMatch[2]
            };
        }

        const mrMatch = url.match(/^https?:\/\/[^/]+\/(.+)\/-\/merge_requests\/(\d+)$/);
        if (mrMatch) {
            return {
                type: 'merge_request',
                projectPath: mrMatch[1],
                iid: mrMatch[2]
            };
        }

        const issueMatch = url.match(/^https?:\/\/[^/]+\/(.+)\/-\/issues\/(\d+)$/);
        if (issueMatch) {
            return {
                type: 'issue',
                projectPath: issueMatch[1],
                iid: issueMatch[2]
            };
        }

        return null;
    }

})();
