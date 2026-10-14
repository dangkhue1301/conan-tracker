# Kiểm tra và giới hạn bàn giao

## Đã kiểm tra trên máy

- `npm test`: 60 bài kiểm tra trong 5 file. Phần giao diện chạy trong DOM cục bộ (JSDOM), phần cơ sở dữ liệu chạy migration thật trên PostgreSQL cục bộ qua PGlite. Có kiểm tra quyền của helper RLS tự động do Dashboard tạo.
- `npm run build`: TypeScript và Vite tạo bản production thành công.
- Bản build với base path `/conan-tracker/`: kiểm tra đường dẫn JS/CSS, favicon, avatar và notice để chuẩn bị GitHub Pages.

| Nhóm            | Nội dung                                                                                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ngày và báo cáo | Múi giờ Việt Nam tại nửa đêm, tuần thứ Hai–Chủ nhật qua năm mới, lịch có ngày hiệu lực và bảo toàn giai đoạn lịch sử, mẫu số cả tuần, loại ngày được nghỉ, không gọi ngày tương lai là bỏ sót, làm thêm không vượt 100% |
| Checklist       | Tick và mở lại vẫn giữ, ôn bài yêu cầu ghi chú, sửa ghi chú với phiên bản, giữ bản nháp khi tab khác sửa, từ chối ghi đè từ bản cũ, phân biệt lỗi lưu và lỗi tải lại                                                    |
| Quyền           | Conan sửa trong tuần hiện tại; mentor sửa lịch sử; không tick tương lai; ba mẹ xem/gửi lời nhắn; tài khoản ngoài danh sách và anonymous bị chặn; không sửa vai hay bảng trực tiếp từ client                             |
| Quản lý         | Lịch mới chỉ từ tương lai, chống trùng ngày/ghi đè từ phiên bản cũ, giữ yêu cầu cũ, mức ít nhất không vượt mức đầy đủ, URL mới chưa tác động hôm nay, tối đa hai mục tiêu                                               |
| Cá nhân hoá     | Chọn avatar/màu và giữ qua lần mở lại, chỉ người lớn tải ảnh, kho ảnh private và upload theo thư mục người dùng                                                                                                         |
| Khuyến khích    | Tác giả lời nhắn do server xác nhận, ba mẹ không gỡ lời người khác, phần thưởng đang ẩn không được trả về cho Conan/ba mẹ                                                                                               |

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

## Thêm việc dọn bàn học (13/10/2026)

- Việc thứ bảy: Dọn bàn học và sách vở, làm đủ 5 phút, không có mức ít nhất hoặc giờ cố định. Có trong checklist, bảng tuần và màn Quản lý.
- Kiểm thử việc tick, mở lại và xem trên bảng tuần; sao chép lịch sáu việc tự bổ sung việc mới.
- Kiểm thử migration trên PostgreSQL: giữ lịch sử sáu việc, giữ lượt tick và URL đã chỉnh, cập nhật lịch tương lai, chạy lại không tạo trùng; lịch đang bắt đầu hôm nay được mở rộng mà không đổi ID hay các lượt tick.
- Mẫu số tuần chỉ bổ sung việc dọn bàn từ ngày có hiệu lực; không tính các ngày trước đó là thiếu việc. Quyền của ba mẹ và điều kiện ghi chú ôn bài tiếp tục được kiểm tra.
- Đã áp dụng migration trên Supabase thật và kiểm tra hàm ghi nhận trong transaction được rollback hoàn toàn. Không để lại lượt hoàn thành giả; các lượt tick khác giữ nguyên trong quá trình kiểm tra.

## ConanHabit: Shop và thói quen (14/10/2026)

- Đổi tên thành ConanHabit; dashboard có bốn thẻ tổng quan, bảng bảy việc, biểu đồ tuần/streak, sáng/tối và bong bóng lời nhắn. URL dùng lịch đã có hiệu lực; lịch tương lai không đổi link hôm nay.
- Coin và XP độc lập; điểm từ lịch sử có hiệu lực, ngày nghỉ không có điểm, sửa tick điều chỉnh nguồn thu. Mua được kiểm tra bằng catalog trên server và khóa giao dịch chung với thay đổi tiến độ; retry không trừ tiền hai lần. Vật phẩm giữ vĩnh viễn, khoản thiếu sau sửa tick bù bằng thu nhập tương lai.
- Catalog gồm 78 món mua và một khung miễn phí. Avatar tải vào bucket riêng tư; learner/mentor chỉ ghi ảnh dưới thư mục của mình. Khung, banner, danh hiệu và kiếm tĩnh; linh thú, lửa streak và mừng cột mốc có chuyển động, hỗ trợ reduced-motion.
- Khôi phục streak có lời tự nhìn lại, một ngày mỗi tháng, chỉ mentor duyệt. Quà tháng cần đủ tháng dương lịch, ba mẹ/mentor duyệt, một yêu cầu còn hiệu lực mỗi tháng. Không tích hợp thanh toán hoặc mua quà ngoài đời.
- Giải gồm 29 đối thủ ảo với tên và avatar hư cấu; thông tin giải nói rõ mô phỏng. Bot có lịch điểm cố định, top 1 có thể đạt được; kết quả chỉ chốt một lần, tuần không tham gia không xuống hạng.
- 108/108 kiểm thử trên 9 file đạt, bao gồm tương tác App/Shop, PostgreSQL, repository, lịch sử, quyền, phép tính điểm và trạng thái đồng bộ. TypeScript và build đạt. Build còn cảnh báo chunk JavaScript lớn hơn 500 kB; đây là cảnh báo không chặn build.
- Migration `20261014021649_conanhabit_gamification.sql` đã áp dụng trên Supabase. Hash toàn bộ check-in, số lượt và số kế hoạch trước/sau khớp nhau. Snapshot thật được kiểm tra bằng vai mentor trong transaction rollback: ví 0 Coin đã tiêu, một khung miễn phí; anon không gọi được game_action, snapshot nội bộ cũ không được exposed.
- Advisors không có lỗi RLS mới. Cảnh báo SECURITY DEFINER cho các RPC gọi có chủ đích vẫn hiện; mỗi RPC kiểm tra allowlist/vai trước khi đọc hoặc ghi, helper riêng không được cấp quyền. Xem [quy tắc kiểm tra RPC](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Cảnh báo bảo vệ mật khẩu cũ giữ nguyên; ứng dụng sử dụng Google OAuth.
- Rà bản HTTPS bằng demo trên laptop 1366px và điện thoại 390px: bảng chia cột đều, Shop bốn cột trên laptop/hai cột trên điện thoại, không tràn ngang toàn trang. Đã sửa tiêu đề Shop bị ép hẹp, avatar header quá cỡ và bong bóng lời nhắn che nội dung khi không có tin mới.
- Xem thử pet xác nhận chuyển động `cosmetic-pet-bob`; khung/kiếm tĩnh. Đã tìm và sửa lỗi trùng tên lớp chủ đề flame với icon flame làm mất lớp toàn màn hình. Bổ sung kiểm thử áp dụng CSS thật để bảo đảm overlay luôn fixed và không nhận kích thước icon; 9/9 kiểm thử Shop/overlay đạt sau sửa.
- Thao tác mua trực tiếp trong demo bị kiểm duyệt tự động chặn vì tiêu Coin và lưu giao dịch. Không thử lại qua cách khác. Mua/xác nhận/trang bị đã được kiểm thử tự động bằng DemoRepository thật và RPC trong PostgreSQL; không thực hiện mua trong tài khoản production.

## Huy hiệu, cỡ chữ và Muichiro - Premium (14/10/2026)

- Thay mười icon khiên đồng dạng bằng mười huy hiệu SVG có hình và chất liệu riêng. Thay sáu ngọn lửa ăn mừng bằng sáu biểu tượng và bảng màu khác nhau. Tăng chữ chính lên 16px và chữ phụ 13–14px với system font stack.
- Muichiro - Premium thuộc bộ sưu tập Demon Slayer, là PNG RGBA 1254 × 1254. Đã kiểm tra alpha tâm và góc bằng 0; bản dùng trong app ở `public/cosmetics/mist-swordsman-frame.png`. Prompt/mode tạo ảnh ghi tại `docs/PREMIUM_FRAME.md`.
- Migration bổ sung SKU Premium giá 4.000 Coin, best streak 40 ngày và bỏ catalog vũ khí. Hash check-in và game_state trước/sau khớp; không đổi số dư, trang bị, quyền hoặc lịch sử học khi cập nhật catalog.
- Kiểm thử PostgreSQL xác nhận mua được tại mốc 40 ngày khi đủ Coin, bị chặn ở 39 ngày dù có đủ Coin, retry không trừ tiền hai lần và XP giữ nguyên. SKU vũ khí cũ bị từ chối; giao diện ẩn nhóm này và không render vũ khí từng trang bị.
- Kiểm thử UI bổ sung sáu biểu tượng khác nhau, hiệu ứng toàn màn hình theo lựa chọn và chuyển giữa khung PNG/SVG an toàn. TypeScript, format và build đạt trước triển khai.
- 14/14 kiểm thử trong `tests/new-ui.test.tsx` đạt sau khi bổ sung bộ lọc Demon Slayer: chọn từ nhóm linh thú tự chuyển về khung, chỉ giữ đúng Muichiro - Premium; tìm theo tên bộ sưu tập vẫn thấy khung. Card và preview có tên Premium riêng, đúng giá 4.000 Coin/streak 40 ngày, không phát sinh giao dịch khi lọc hoặc xem thử.
- Trang giải giữ nhãn “Giải đấu mô phỏng”, mười huy hiệu hạng và luật trực tiếp trong “Mục tiêu của tuần”; nút/popup “Thông tin giải” đã bỏ. Kiểm thử UI xác nhận các phần này và không gọi hành động tham gia/mua.

## Thêm 13 khung Demon Slayer - Premium (14/10/2026)

- Thêm Giyu, Tengen, Nezuko, Douma, Muzan, Sanemi, Obanai, Rengoku, Mitsuri, Gyomei, Akaza, Kokushibo và Tanjiro; giữ Muichiro đã có, không tạo bản trùng. Tên đều theo mẫu “Gyomei - Premium”, đúng chủ đề Demon Slayer và huy hiệu Premium.
- 13 PNG RGBA 1254 × 1254 đã đối chiếu bằng bản ghép xem ảnh. Alpha tâm bằng 0; các góc bằng 0 hoặc 1/255 do viền sáng rất nhẹ. Bản dùng trong app nằm ở `public/cosmetics/demon-slayer/`; ảnh gốc được giữ ở nơi tạo.
- Tên có màu, gradient và ánh sáng theo từng khung, với hai bảng màu sáng/tối. Playwright trên Edge xác nhận cả 14 ảnh tải được, tên trong Shop và preview có đúng màu; reduced-motion dừng animation.
- Đã rà bộ lọc Demon Slayer ở 1366px trên giao diện sáng/tối và cửa sổ xem thử Gyomei ở 390px, không tràn ngang trang. Chỉ dùng demo trên máy, không thực hiện mua trong tài khoản thật. Kết quả và ảnh QA lưu cục bộ dưới `qa/`, không đưa vào repository.
- 122/122 kiểm thử trên 9 file đạt; format, TypeScript và build đạt. Kiểm thử PostgreSQL so khớp toàn bộ catalog với frontend, xác nhận Muichiro/Gyomei/Kokushibo mua và trang bị được tại mốc 40 ngày khi đủ Coin, bị chặn ở 39 ngày, retry không trừ Coin hai lần và XP giữ nguyên.
- Migration `add_demon_slayer_premium_frames` đã áp dụng lên Supabase; truy vấn lại xác nhận 13 SKU mới cùng Muichiro có giá 4.000 Coin, streak 40 ngày, extra 0. SQL chỉ upsert catalog, không cập nhật ví, inventory hoặc lịch sử.
