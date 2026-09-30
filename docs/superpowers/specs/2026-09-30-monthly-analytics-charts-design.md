# Thiết Kế Chi Tiết: Phân Hệ Phân Tích & Biểu Đồ KPI Tháng (Monthly Analytics & Charts)

- **Ngày tạo:** 30/09/2026
- **Trạng thái:** Đã phê duyệt (Approved)
- **Tác giả:** Antigravity & User

---

## 1. Mục Tiêu & Bối Cảnh
Hiện tại trang KPI (`page/page.html`) hiển thị rất nhiều dữ liệu chi tiết dạng bảng danh sách công việc (Task & Merge Request), các thẻ số liệu và widget dự báo điểm KPI. Người dùng cần:
1. Một góc nhìn trực quan tổng quan theo **Tháng**: xem được cơ cấu công việc, tỷ lệ hoàn thành, mức độ chênh lệch thời gian ước tính (Estimate) và thời gian thực tế ghi nhận (Spent).
2. Công cụ kiểm soát Log Time theo ngày làm việc chuẩn (Daily Timesheet Audit) để phát hiện sớm các ngày chưa log đủ 8h (Thứ 2 đến Thứ 6), tránh bị trừ điểm KPI vào cuối tháng.
3. Không làm rối giao diện bảng công việc hiện tại, tách thành 2 tab điều hướng mượt mà:
   - **Tab 1: 📋 Bảng công việc (Work Items)**
   - **Tab 2: 📊 Phân tích & Biểu đồ Tháng (Monthly Analytics)**

---

## 2. Kiến Trúc Phân Hệ & Giao Diện (UI / UX)

### 2.1. Thanh Điều Hướng Tab (Tab Navigation Bar)
- Vị trí: Đặt ngay bên dưới thanh bộ lọc (`filter-card`) và trên khu vực nội dung chính (`report-area`).
- Gồm 2 tab:
  - `<button class="tab-btn active" id="tabWorkItemsBtn">📋 Bảng công việc</button>`
  - `<button class="tab-btn" id="tabAnalyticsBtn">📊 Phân tích & Biểu đồ Tháng</button>`
- Trạng thái: Chuyển đổi hiển thị giữa container `#workItemsTabContent` (chứa toàn bộ giao diện bảng, search, quick filter, dự báo KPI hiện tại) và `#analyticsTabContent` (giao diện phân tích & biểu đồ).

### 2.2. Nội Dung Tab Phân Tích & Biểu Đồ Tháng (`#analyticsTabContent`)
Được chia thành 3 khối chính:

#### Khối 1: Thẻ Tóm Tắt Chỉ Số Tháng (Monthly KPI KPI Header Cards)
- **Điểm KPI Tháng Dự Kiến:** Thang 100, hiển thị màu theo cấp bậc (Xuất sắc / Tốt / Trung bình / Nguy hiểm).
- **Chỉ tiêu & Giờ làm việc tháng:** Tổng giờ Spent / Tổng giờ chuẩn (VD: `168h / 176h` - 22 ngày làm việc x 8h).
- **Tỷ lệ Hoàn thành đúng hạn:** `% in-time`.
- **Tổng Merge Requests:** Số MR đã merge / Tổng MR.

#### Khối 2: Bảng Kiểm Tra Log Time Hàng Ngày (Daily Timesheet Audit)
- Tự động lấy tất cả các ngày trong tháng được chọn trên bộ lọc tháng (`monthSelect`).
- Quy định định mức chuẩn:
  - Các ngày Thứ 2 đến Thứ 6 là ngày làm việc chuẩn: chỉ tiêu `8.0h/ngày`.
  - Thứ 7 và Chủ Nhật: không bắt buộc, nếu có log giờ thì vẫn tính cộng dồn vào tổng giờ tháng.
- Bảng lưới Calendar Matrix trực quan:
  - 🟢 **Đạt chuẩn (>= 8h):** Nền xanh lục nhạt, viền xanh, icon ✅, hiển thị giờ (VD: `8.5h`).
  - 🟡 **Thiếu giờ (0h < spent < 8h):** Nền vàng nhạt, viền vàng cam, icon ⚠️, hiển thị giờ thiếu (VD: `6.0h (-2.0h)`).
  - 🔴 **Chưa log (0h) trong quá khứ / hôm nay:** Nền đỏ nhạt, viền đỏ, icon ❌, cảnh báo `0.0h (-8.0h)`.
  - ⚪ **Ngày tương lai (chưa tới):** Tông xám trung tính, không cảnh báo lỗi.
- Khi bấm vào một ngày cụ thể: Mở modal hoặc danh sách chi tiết các công việc/MR đã log giờ trong ngày đó.

#### Khối 3: Cụm Biểu Đồ Trực Quan (Monthly Charts Grid)
Bố trí lưới 2 cột co giãn responsive:
1. **Chart 1 - Estimate vs Spent Theo Tuần (Grouped Bar Chart):**
   - Trục X: Tuần 1, Tuần 2, Tuần 3, Tuần 4, Tuần 5 của tháng.
   - Cột so sánh: Giờ Estimate (xanh dương) vs Giờ Spent (cam tím).
   - Cho biết tuần nào bị over-budget hoặc under-estimated.
2. **Chart 2 - Cơ Cấu Kế Hoạch vs Phát Sinh (Doughnut Chart):**
   - Tỷ lệ % Task có trong kế hoạch (Planned) vs Task phát sinh (Unplanned).
3. **Chart 3 - Tỷ Lệ Tình Trạng Công Việc (Doughnut Chart):**
   - Tỷ lệ Đúng hạn (In-time) vs Trễ hạn (Late) vs Đang mở (Open).
4. **Chart 4 - Xu Hướng Điểm KPI Qua Các Tuần (Line Chart):**
   - Đường biểu diễn biến thiên điểm KPI qua từng tuần trong tháng.

---

## 3. Giải Pháp Kỹ Thuật (Chrome Extension Manifest V3)

### 3.1. Thư viện Chart.js Offline
- Tải bản đóng gói UMD `chart.umd.min.js` (Chart.js v4.x UMD build) lưu trực tiếp tại `page/chart.umd.min.js`.
- Khai báo trong `page/page.html` qua thẻ `<script src="chart.umd.min.js"></script>`.
- Đảm bảo 100% không gọi external URL, không vi phạm CSP của Manifest V3, hoạt động offline hoàn toàn.

### 3.2. Quản Lý Vòng Đời Biểu Đồ (Chart Lifecycle & Memory Management)
- Khai báo đối tượng lưu trữ các instance biểu đồ:
  ```javascript
  const analyticsCharts = {
      weeklyEstSpent: null,
      taskTypeDoughnut: null,
      taskStatusDoughnut: null,
      kpiTrendLine: null
  };
  ```
- Trước khi vẽ lại dữ liệu (khi người dùng bấm "Thống kê" hoặc đổi `monthSelect`), gọi `.destroy()` trên từng instance cũ để tránh rò rỉ bộ nhớ hoặc vẽ đè canvas.

### 3.3. Tính Toán Dữ Liệu Tháng (Data Aggregation Logic)
- **Nguồn dữ liệu:** Mảng `KpiInfo` lưu trong `chrome.storage.local`.
- Lọc toàn bộ item thuộc tháng được chọn: `parseToIsoDate(item.addedAt).startsWith(selectedMonth)`.
- **Tổng hợp Timesheet theo ngày:**
  - Tạo bảng ánh xạ ngày trong tháng (`1` đến `daysInMonth`).
  - Lặp qua danh sách task và MR, cộng dồn `totalSpentTime` vào ngày tương ứng (`addedAt`).
- **Tổng hợp theo tuần của tháng:**
  - Dùng hàm `getWeeksOfMonth(selYear, selMonth)` đã có sẵn trong `utils.js` để nhóm items theo từng tuần.
  - Tính tổng Estimate, Spent, In-time, Late, Reopen, Unplanned cho từng tuần.

---

## 4. Kế Hoạch Kiểm Thử & Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. **Kiểm tra chuyển Tab:**
   - Chuyển đổi qua lại giữa Tab 1 và Tab 2 mượt mà, không bị mất trạng thái hoặc lỗi hiển thị.
2. **Kiểm tra Timesheet Audit:**
   - Tháng được chọn hiển thị đủ số ngày (28, 29, 30 hoặc 31 ngày).
   - Các ngày T2-T6 chưa đủ 8h hiển thị đúng cảnh báo màu vàng/đỏ.
   - Thứ 7 & CN không bị báo lỗi thiếu giờ.
   - Thẻ tóm tắt tính đúng tổng ngày công và tổng giờ.
3. **Kiểm tra Biểu Đồ:**
   - 4 biểu đồ hiển thị đúng số liệu, màu sắc hài hòa, tooltip hiển thị chi tiết khi rê chuột.
   - Khi chọn tháng khác trên dropdown `monthSelect`, biểu đồ cập nhật số liệu tương ứng của tháng mới mà không bị lỗi canvas đè nhau.
4. **Kiểm tra Không Hỏng Tính Năng Cũ:**
   - Tab 1 hoạt động bình thường 100% (tìm kiếm nhanh, filter chip, nút xuất Excel tuần/tháng, xuất Daily report, xóa tuần/tháng).
   - Extension tải và chạy trơn tru trong Chrome MV3, không có lỗi console.
