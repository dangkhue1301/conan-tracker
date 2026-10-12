# Kiểm tra và giới hạn bàn giao

## Đã kiểm tra trên máy

- `npm test`: 42 bài kiểm tra trong 4 file. Phần giao diện chạy trong DOM cục bộ (JSDOM), phần cơ sở dữ liệu chạy migration thật trên PostgreSQL cục bộ qua PGlite. Có kiểm tra quyền của helper RLS tự động do Dashboard tạo.
- `npm run build`: TypeScript và Vite tạo bản production thành công.
- Bản build với base path `/conan-tracker/`: kiểm tra đường dẫn JS/CSS, favicon, avatar và notice để chuẩn bị GitHub Pages.

| Nhóm            | Nội dung                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ngày và báo cáo | Múi giờ Việt Nam tại nửa đêm, tuần thứ Hai–Chủ nhật qua năm mới, giai đoạn có ngày hiệu lực, mẫu số cả tuần, loại ngày được nghỉ, không gọi ngày tương lai là bỏ sót, làm thêm không vượt 100% |
| Checklist       | Tick và mở lại vẫn giữ, ôn bài yêu cầu ghi chú, sửa ghi chú với phiên bản, giữ bản nháp khi tab khác sửa, từ chối ghi đè từ bản cũ, phân biệt lỗi lưu và lỗi tải lại                           |
| Quyền           | Conan sửa trong tuần hiện tại; mentor sửa lịch sử; không tick tương lai; ba mẹ xem/gửi lời nhắn; tài khoản ngoài danh sách và anonymous bị chặn; không sửa vai hay bảng trực tiếp từ client    |
| Quản lý         | Lịch mới chỉ từ tương lai, giữ yêu cầu cũ, mức ít nhất không vượt mức đầy đủ, URL mới chưa tác động hôm nay, tối đa hai mục tiêu                                                               |
| Cá nhân hoá     | Chọn avatar/màu và giữ qua lần mở lại, chỉ người lớn tải ảnh, kho ảnh private và upload theo thư mục người dùng                                                                                |
| Khuyến khích    | Tác giả lời nhắn do server xác nhận, ba mẹ không gỡ lời người khác, phần thưởng đang ẩn không được trả về cho Conan/ba mẹ                                                                      |

Auth và Storage infrastructure trong test SQL được mô phỏng để kiểm tra quyền; không thay thế việc kiểm tra hệ thống Supabase thật. DOM test xác nhận các thao tác và trạng thái, không xác nhận bố cục bằng ảnh.

## Đã kiểm tra trên Supabase thật (12/10/2026)

- Dự án ở Singapore hoạt động; đã cài schema và hai thành viên vào allowlist riêng trong Supabase. Email thật không nằm trong mã nguồn.
- Cả chín bảng bật RLS; client không có quyền ghi bảng trực tiếp. Kho `family-assets` private, giới hạn JPG/PNG/WebP và 5 MB.
- Kiểm tra quyền bằng transaction trên database thật: người hướng dẫn thấy dữ liệu được phép, learner không thấy phần thưởng ẩn, outsider/anonymous bị chặn. Transaction đã rollback; không lưu hồ sơ hay tiến độ giả.
- Đã thu hồi quyền chạy helper nội bộ `rls_auto_enable` khỏi các vai API. Advisor không còn cảnh báo SECURITY DEFINER dành cho anonymous. Các RPC dành cho người đã đăng nhập giữ SECURITY DEFINER có chủ đích và kiểm tra allowlist/vai trò ở server.
- Repository GitHub đã tạo và đã cấu hình hai biến build công khai cho URL/key Supabase.

## Đã deploy và kiểm tra bản công khai (12/10/2026)

- [GitHub Actions](https://github.com/dangkhue1301/conan-tracker/actions/runs/38269393009) đã chạy thành công trên commit `81571e8`: cài dependency, kiểm tra format, 42 bài kiểm tra, build và deploy GitHub Pages.
- [Website thật](https://dangkhue1301.github.io/conan-tracker/) đã mở trong trình duyệt tại viewport mặc định 1280 × 720. Trang đăng nhập, CSS và avatar tải đúng; trang không tràn ngang. Đã lưu ảnh xác nhận trong cache cục bộ, không đưa ảnh quản trị lên repository.
- Google provider đã bật; email/password và anonymous tắt. Site URL và redirect về đúng địa chỉ GitHub Pages, không dùng wildcard. Google OAuth app đang ở chế độ Testing.
- Đăng nhập Google thật của người hướng dẫn đã trở về website, nhận đúng vai và mở màn khởi tạo hồ sơ. App chỉ yêu cầu email/profile; theo [Google](https://support.google.com/cloud/answer/15549945?hl=en), không cần thêm Test users cho các quyền đăng nhập cơ bản này. Danh sách truy cập dữ liệu vẫn do Supabase kiểm soát.
- Đã khởi tạo hồ sơ Conan và kế hoạch giai đoạn 1 từ ngày 12/10/2026 qua giao diện thật. Màn Hôm nay hiển thị bốn việc, Tiến độ hiển thị 0/28 lượt và phân biệt ngày chưa đến; Quản lý có URL học để trống và phần thưởng đang ẩn. Phiên đăng nhập và hồ sơ giữ nguyên sau khi tải lại trang.
- Database xác nhận một hồ sơ, hai thành viên, không có check-in hoặc phần thưởng. Không tạo tiến độ mẫu trong hệ thống thật.

## Phần còn cần xác nhận khi bàn giao

Đăng nhập trực tiếp bằng tài khoản Conan, signed URL qua Supabase Storage và Realtime giữa hai thiết bị chưa được xác nhận bằng thao tác dùng thật. Quy trình kiểm tra sau thiết lập nằm trong README.

Công cụ trình duyệt từ chối mở localhost theo chính sách công cụ; việc kiểm tra giao diện ở trên dùng website công khai đã deploy. Chưa xác nhận bố cục trên điện thoại; CSS đã có bố cục responsive.
