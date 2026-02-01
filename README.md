# GitLab Productivity Extension 📊

Dự án này là một Chrome Extension giúp quản lý, theo dõi và thống kê hiệu suất làm việc (KPI) trực tiếp từ GitLab. Công cụ hỗ trợ người dùng thu thập thông tin về các Task và Merge Request, từ đó đưa ra các báo cáo chi tiết về thời gian và tiến độ.

## 🚀 Tính năng chính

- **Theo dõi thông minh**: Tự động nhận diện và thu thập ID của Task và Merge Request khi bạn lướt GitLab.
- **Thống kê KPI chi tiết**:
  - Tính toán tổng thời gian Estimate vs Spent.
  - Phân loại task: Kế hoạch (Planned) vs Phát sinh (Unplanned).
  - Theo dõi tiến độ: Đúng hạn vs Trễ hạn.
  - Thống kê số lần bị Reopen.
- **Lọc theo ngày**: Hỗ trợ chọn nhanh các ngày trong tuần để xem báo cáo cụ thể cho từng thời điểm.
- **Xuất dữ liệu**: Hỗ trợ xuất tất cả bảng thống kê ra file CSV để báo cáo.
- **Daily Task Generator**: Tự động tổng hợp các task đã làm trong ngày và tạo nội dung báo cáo daily chỉ với một cú click (tự động copy vào clipboard).
- **Giao diện hiện đại**: Thiết kế tối giản, trực quan, hỗ trợ Spinner khi tải dữ liệu.

## 🛠 Cấu trúc dự án

- `manifest.json`: File cấu hình của Chrome Extension (v3).
- `page/`: Chứa mã nguồn cho trang báo cáo KPI chính (`page.html`, `page.js`, `page.css`).
- `content_issue.js` & `content_request.js`: Script chạy trên trang GitLab để thêm nút "Add to tracking".
- `background.js`: Xử lý các tác vụ nền.
- `utils.js`: Chứa các hàm dùng chung (xử lý ngày tháng, storage, clean group name...).
- `popup/`: Giao diện khi nhấn vào icon extension trên trình duyệt.

## 📥 Cài đặt

1. Tải toàn bộ mã nguồn về máy.
2. Mở trình duyệt Chrome, truy cập `chrome://extensions/`.
3. Bật **Developer mode** (Chế độ nhà phát triển) ở góc trên bên phải.
4. Nhấn nút **Load unpacked** (Tải tiện ích đã giải nén) và chọn thư mục chứa dự án này.

## 📖 Hướng dẫn sử dụng

1. **Thiết lập Access Token**: Đảm bảo bạn đã cấu hình GitLab Access Token thông qua giao diện popup để extension có quyền gọi GraphQL API.
2. **Thêm Task/MR**: Truy cập vào các Issue hoặc Merge Request trên GitLab, bạn sẽ thấy nút "Add" (biểu tượng dấu cộng xanh) để đưa vào danh sách theo dõi.
3. **Xem báo cáo**: Nhấn vào icon Extension và mở trang **Dashboard** (KPI Report).
4. **Thống kê**: 
   - Chọn ngày cần xem ở dropdown "Lọc theo ngày".
   - Nhấn nút **📊 Thống kê** để lấy dữ liệu mới nhất từ GitLab.
   - Sử dụng nút **⌛ Daily task** để lấy nội dung báo cáo nhanh.
   - Sử dụng nút **📁 Xuất CSV** nếu cần lưu trữ file.

## 👤 Tác giả

- **Thạch Đẹp trai 102**

---
*Dự án này được phát triển cho mục đích cải thiện năng suất cá nhân khi làm việc với hệ thống GitLab.*
