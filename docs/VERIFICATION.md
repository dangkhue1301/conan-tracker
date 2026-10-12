# Kiểm tra và giới hạn bàn giao

## Đã kiểm tra trên máy

- `npm test`: 41 bài kiểm tra trong 4 file. Phần giao diện chạy trong DOM cục bộ (JSDOM), phần cơ sở dữ liệu chạy migration thật trên PostgreSQL cục bộ qua PGlite.
- `npm run build`: TypeScript và Vite tạo bản production thành công.
- Bản build với base path `/conan-tracker/`: kiểm tra đường dẫn JS/CSS, favicon, avatar và notice để chuẩn bị GitHub Pages.

| Nhóm | Nội dung |
| --- | --- |
| Ngày và báo cáo | Múi giờ Việt Nam tại nửa đêm, tuần thứ Hai–Chủ nhật qua năm mới, giai đoạn có ngày hiệu lực, mẫu số cả tuần, loại ngày được nghỉ, không gọi ngày tương lai là bỏ sót, làm thêm không vượt 100% |
| Checklist | Tick và mở lại vẫn giữ, ôn bài yêu cầu ghi chú, sửa ghi chú với phiên bản, giữ bản nháp khi tab khác sửa, từ chối ghi đè từ bản cũ, phân biệt lỗi lưu và lỗi tải lại |
| Quyền | Conan sửa trong tuần hiện tại; mentor sửa lịch sử; không tick tương lai; ba mẹ xem/gửi lời nhắn; tài khoản ngoài danh sách và anonymous bị chặn; không sửa vai hay bảng trực tiếp từ client |
| Quản lý | Lịch mới chỉ từ tương lai, giữ yêu cầu cũ, mức ít nhất không vượt mức đầy đủ, URL mới chưa tác động hôm nay, tối đa hai mục tiêu |
| Cá nhân hoá | Chọn avatar/màu và giữ qua lần mở lại, chỉ người lớn tải ảnh, kho ảnh private và upload theo thư mục người dùng |
| Khuyến khích | Tác giả lời nhắn do server xác nhận, ba mẹ không gỡ lời người khác, phần thưởng đang ẩn không được trả về cho Conan/ba mẹ |

Auth và Storage infrastructure trong test SQL được mô phỏng để kiểm tra quyền; không thay thế việc kiểm tra hệ thống Supabase thật. DOM test xác nhận các thao tác và trạng thái, không xác nhận bố cục bằng ảnh.

## Cần kiểm tra khi có tài khoản thật

Google OAuth, whitelist với email thật, signed URL qua Supabase Storage, Realtime trên hai thiết bị và workflow deploy GitHub Pages chưa được chạy trên tài khoản của bạn. Quy trình kiểm tra sau thiết lập nằm trong README.

Công cụ trình duyệt của phiên làm việc từ chối mở localhost theo chính sách công cụ. Vì vậy chưa xác nhận giao diện bằng ảnh chụp trên laptop/điện thoại hoặc thao tác trong trình duyệt thật. CSS đã có bố cục responsive; cần xem lại trực tiếp sau khi chạy `npm run dev` trước khi sử dụng hằng ngày.

Không có dự án Supabase/repository thật trong lần bàn giao này, nên không có URL public đã triển khai. Mã nguồn, migration, template whitelist và workflow đã được chuẩn bị để bạn thiết lập.
