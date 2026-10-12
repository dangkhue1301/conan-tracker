# Kiểm tra và giới hạn bàn giao

## Đã kiểm tra trên máy

- `npm test`: 42 bài kiểm tra trong 4 file. Phần giao diện chạy trong DOM cục bộ (JSDOM), phần cơ sở dữ liệu chạy migration thật trên PostgreSQL cục bộ qua PGlite. Có kiểm tra quyền của helper RLS tự động do Dashboard tạo.
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

## Đã kiểm tra trên Supabase thật (12/10/2026)

- Dự án ở Singapore hoạt động; đã cài schema và hai thành viên vào allowlist riêng trong Supabase. Email thật không nằm trong mã nguồn.
- Cả chín bảng bật RLS; client không có quyền ghi bảng trực tiếp. Kho `family-assets` private, giới hạn JPG/PNG/WebP và 5 MB.
- Kiểm tra quyền bằng transaction trên database thật: người hướng dẫn thấy dữ liệu được phép, learner không thấy phần thưởng ẩn, outsider/anonymous bị chặn. Transaction đã rollback; không lưu hồ sơ hay tiến độ giả.
- Đã thu hồi quyền chạy helper nội bộ `rls_auto_enable` khỏi các vai API. Advisor không còn cảnh báo SECURITY DEFINER dành cho anonymous. Các RPC dành cho người đã đăng nhập giữ SECURITY DEFINER có chủ đích và kiểm tra allowlist/vai trò ở server.
- Repository GitHub đã tạo và đã cấu hình hai biến build công khai cho URL/key Supabase.

## Cần kiểm tra sau cấu hình đăng nhập và deploy

Google OAuth, signed URL qua Supabase Storage, Realtime trên hai thiết bị và workflow deploy GitHub Pages chưa được xác nhận trên app dùng thật. Quy trình kiểm tra sau thiết lập nằm trong README.

Công cụ trình duyệt của phiên làm việc từ chối mở localhost theo chính sách công cụ. Vì vậy chưa xác nhận giao diện bằng ảnh chụp trên laptop/điện thoại hoặc thao tác trong trình duyệt thật. CSS đã có bố cục responsive; cần xem lại trực tiếp sau khi chạy `npm run dev` trước khi sử dụng hằng ngày.

Website chưa được công bố trong bước kiểm tra này; cấu hình Google OAuth đang được hoàn tất trước khi deploy.
