# Kiểm tra và giới hạn bàn giao

## Đã kiểm tra trên máy

- `npm test`: 53 bài kiểm tra trong 5 file. Phần giao diện chạy trong DOM cục bộ (JSDOM), phần cơ sở dữ liệu chạy migration thật trên PostgreSQL cục bộ qua PGlite. Có kiểm tra quyền của helper RLS tự động do Dashboard tạo.
- `npm run build`: TypeScript và Vite tạo bản production thành công.
- Bản build với base path `/conan-tracker/`: kiểm tra đường dẫn JS/CSS, favicon, avatar và notice để chuẩn bị GitHub Pages.

| Nhóm            | Nội dung                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ngày và báo cáo | Múi giờ Việt Nam tại nửa đêm, tuần thứ Hai–Chủ nhật qua năm mới, lịch có ngày hiệu lực và bảo toàn giai đoạn lịch sử, mẫu số cả tuần, loại ngày được nghỉ, không gọi ngày tương lai là bỏ sót, làm thêm không vượt 100% |
| Checklist       | Tick và mở lại vẫn giữ, ôn bài yêu cầu ghi chú, sửa ghi chú với phiên bản, giữ bản nháp khi tab khác sửa, từ chối ghi đè từ bản cũ, phân biệt lỗi lưu và lỗi tải lại                           |
| Quyền           | Conan sửa trong tuần hiện tại; mentor sửa lịch sử; không tick tương lai; ba mẹ xem/gửi lời nhắn; tài khoản ngoài danh sách và anonymous bị chặn; không sửa vai hay bảng trực tiếp từ client    |
| Quản lý         | Lịch mới chỉ từ tương lai, chống trùng ngày/ghi đè từ phiên bản cũ, giữ yêu cầu cũ, mức ít nhất không vượt mức đầy đủ, URL mới chưa tác động hôm nay, tối đa hai mục tiêu                                                               |
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


## Đợt sửa giao diện 13/10/2026

- Hôm nay hiển thị đủ sáu việc, Ôn bài đã học có ghi chú ngay dưới dòng và Tập viết tiếng Việt có tên rõ ràng. Lời nhắn cùng ảnh nhỏ nằm trên trang đầu; ba mẹ/người hướng dẫn gửi được tại đây.
- Bảng tuần đặt trước các thống kê. Kiểm tra trình duyệt ở 1366×768, 1440×900, 768px, 820px và 390px: không tràn ngang toàn trang; bảng/biểu đồ rộng cuộn trong vùng riêng. Sáu nút tick có vùng bấm 44×44px.
- Modal có header cố định và chỉ một vùng nội dung cuộn. Menu mức độ đóng khi chọn, bấm ngoài hoặc Escape; có điều hướng bàn phím.
- Kiểm thử PostgreSQL chạy cả migration gốc và migration bổ sung: lịch cũ không đổi, các lượt tick giữ nguyên, migration chạy lại không tạo lịch mới; khách cũ không thể gọi hàm ghi đè lịch.
- Kiểm thử đồng bộ bao gồm event đến trong lúc đang lưu, phản hồi tải dữ liệu về sai thứ tự và phản hồi từ phiên đã đóng.

## Kiểm tra căn chỉnh bổ sung (13/10/2026)

- Kiểm tra bằng dữ liệu minh hoạ trên bản HTTPS đã deploy vì công cụ trình duyệt chặn localhost. Không ghi dữ liệu kiểm tra vào Supabase thật.
- Đo ở 1366×768, 1440×900, 1024×768, 768×1024 và 390×844: cả Hôm nay và Tiến độ không tràn ngang toàn trang. Bảy cột ngày có độ rộng bằng nhau; tâm ô trạng thái lệch dưới 0,01px so với tâm tiêu đề ngày, thay cho độ lệch khoảng 36,5px trước khi sửa.
- Sáu nhóm thao tác có cùng độ rộng 120px. Đồng hồ cách giờ 6px. Ghi chú và thông báo lỗi bắt đầu cùng trục với tên việc; form lời nhắn mở rộng nằm trong cột và xếp thao tác theo chiều dọc.
- Menu của dòng cuối mở lên trên khi thiếu chỗ phía dưới; đã kiểm tra nằm trong viewport và trong vùng nội dung modal. Escape đóng menu. Tiêu đề modal và nút đóng cùng hàng, chỉ nội dung cuộn; nhóm nút cuối có khoảng cách 12px.
- Kiểm tra thêm cửa sổ chỉnh mục tiêu và avatar trên màn hẹp; nút xoá mốc có cột riêng rộng 44px và không chồng lên ngày. Các nút và input dùng chung được thống nhất chiều cao tối thiểu 44px.
- 53 bài kiểm thử hiện có, TypeScript, format và build đã qua. Kết quả đo bố cục được kiểm tra riêng trong trình duyệt; các ảnh xác nhận được lưu cục bộ, không đưa lên repository.
