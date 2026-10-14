# Frontend và tài nguyên

## Cập nhật dễ đọc và nhận diện hạng (14/10/2026)

- System font stack `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, Noto Sans…` áp dụng cả biểu đồ. Chữ chính 16px, phụ 13–14px; Shop và các nhãn hạng được tăng tương ứng.
- Mười hạng có SVG riêng về hình dáng và chất liệu đồng/bạc/vàng/đá quý. Hạng phía trước vẫn có màu; hạng hiện tại được viền bằng màu của chính huy hiệu. Thanh hạng cuộn trong vùng riêng trên màn hẹp.
- Sáu kiểu mừng dùng sáu hình khác nhau và sáu bảng màu: lửa cam, chớp vàng, kim cương cyan, vương miện tím, pha lê lục bảo, sao băng hồng. Thumbnail tĩnh; hiệu ứng toàn màn hình dùng đúng hình đã chọn.
- [Muichiro - Premium](PREMIUM_FRAME.md), thuộc chủ đề **Demon Slayer**, là PNG trong suốt được tạo bằng built-in imagegen từ ảnh tham chiếu. Giá 4.000 Coin và streak 40 ngày được kiểm tra trên server. Shop có nhãn, bộ lọc chủ đề và tìm kiếm theo tên bộ sưu tập. Tên riêng có gradient ngọc bích và ánh sáng chuyển động ở thẻ/xem thử, dừng khi bật giảm chuyển động; bản thân khung vẫn tĩnh. Nhóm vũ khí riêng bị bỏ; dữ liệu sở hữu cũ được giữ để bảo toàn lịch sử, nhưng không hiển thị hoặc cho mua/trang bị thêm.

## ConanHabit (14/10/2026)

Thiết kế hiện tại dùng màu và bố cục từ bản TSX tham chiếu của người dùng: bốn thẻ tổng quan, bảng tuần đầy đủ bảy việc và hai biểu đồ phía dưới. `conanhabit.css` bổ sung theme sáng/tối trên token của evondevKit; lịch sử và phân quyền tiếp tục dùng các component có sẵn. Các URL lấy từ lịch đã có hiệu lực ở ngày đang xem.

Avatar hiện tại do người dùng tải lên, không dùng bộ ảnh mẫu bên dưới để lựa chọn. Khung avatar đang dùng chỉ gồm 14 khung Demon Slayer - Premium bằng PNG trong suốt. 31 khung SVG tự thiết kế đã được tạm gỡ khỏi Shop, lookup và avatar người dùng/giải đấu; định nghĩa giữ trong `ARCHIVED_AVATAR_FRAMES` tại `src/shop-catalog.ts`, lịch sử inventory và trang bị giữ nguyên. Khi cần khôi phục, đưa các định nghĩa này trở lại `SHOP_ITEMS` và tạo migration riêng để upsert đúng 31 SKU. Pet và đồ họa khác của Shop tiếp tục dùng SVG nguyên bản trong `cosmetics.tsx`. Hình vật phẩm trong Shop tĩnh; linh thú có chuyển động nhẹ và tên các khung Premium có màu, gradient và ánh sáng riêng theo nhân vật. Lửa streak và pháo hoa/hạt sáng khi đạt cột mốc vẫn động, có đường dẫn giảm chuyển động bằng CSS. Bản đồ ảnh, tên và prompt của 13 khung Demon Slayer bổ sung nằm ở [DEMON_SLAYER_PREMIUM_FRAMES.md](DEMON_SLAYER_PREMIUM_FRAMES.md).

Coin là tiền nội bộ dùng mua vật phẩm, không kết nối tiền thật hay Robux của Roblox. XP độc lập dùng leo hạng. Đối thủ giải là nhân vật hư cấu, thể hiện bằng nhãn “Giải đấu mô phỏng” ngay đầu trang. Luật tuần hiển thị trong thẻ “Mục tiêu của tuần”, không có nút hoặc popup “Thông tin giải”. Avatar và khung đối thủ được tạo bằng mã trong app, không lấy ảnh trẻ em thật.

## Dựa trên evondevKit

Nguồn: [evondev/evondevKit](https://github.com/evondev/evondevKit), nhánh `master`, đọc ngày 12/10/2026. Đây là bộ hướng dẫn UI/UX, không phải template app React sẵn có. App dùng hướng flat: nền xám nhạt, khối trắng, viền mảnh, bo khoảng 12px; chữ và khoảng cách tạo thứ bậc. Bóng chỉ dùng ở menu, modal và toast.

- Token sáng, màu trạng thái và thanh cuộn được điều chỉnh từ [references/tokens.css](https://github.com/evondev/evondevKit/blob/master/skills/ui-ux/references/tokens.css) vào `src/evon-tokens.css`.
- `src/styles.css` đặt màu nhấn Conan và bố cục cụ thể. Một font hệ thống hỗ trợ tiếng Việt, không phụ thuộc tải font từ dịch vụ ngoài.
- Bố cục chính: checklist chiếm cột lớn, tiến độ tuần/lời động viên ở cột bên; màn Tiến độ ưu tiên bảng tuần. Trên điện thoại các cột xếp dọc, bảng tuần cuộn ngang.
- Button, badge, input, card, modal và empty state dùng cùng quy tắc trong `src/ui.tsx` và CSS. Không cài bộ biểu đồ chỉ để hiển thị 4–12 cột.
- Checklist dùng lưới chung cho ô tick, nội dung, thao tác và ghi chú; metadata dùng flex với nhóm đồng hồ/giờ cách nhau 6px. Bảng tuần chia đều bảy cột ngày và căn giữa ô với tiêu đề; menu chọn mức đo khoảng trống để mở lên hoặc xuống trong vùng nhìn thấy.
- Giữ outline bàn phím và nhãn ARIA cho checkbox/ô bảng dù mẫu thị giác tham chiếu thường rất tối giản; hỗ trợ reduced motion.

Thông báo bản quyền và MIT license giữ ở `THIRD_PARTY_NOTICES.md`; bản đầy đủ kèm thư viện runtime nằm trong `public/THIRD_PARTY_NOTICES.txt` và được đưa vào bản deploy. Không gắn nhãn app là sản phẩm của tác giả evondevKit.

## Avatar

Ba ảnh gốc được tạo bằng built-in ImageGen trong phiên làm việc ngày 12/10/2026. Không dùng CLI hay API key. Đây là nhân vật nguyên bản theo sở thích của Conan; không sao chép nhân vật anime hoặc thương hiệu Roblox.

| File                           | Prompt / hướng tạo                                                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/avatars/detective.png` | Original friendly teenage boy manga avatar, dark tousled hair and glasses, navy/teal jacket, head and shoulders centered in a pale teal circle, confident and calm, suitable for a 14-year-old, no text/logo/existing franchise character. |
| `public/avatars/football.png`  | Matching manga avatar of an original teenage football player with dark hair, navy/teal jersey and a football, centered head and shoulders, pale teal circle, clean and friendly, no text, team logos or existing character.                |
| `public/avatars/builder.png`   | Original polished 3D block character avatar with dark hair and navy/teal hoodie, sandbox building game inspiration, centered on a pale teal circle, friendly and suitable for a teenager, no text, logos or existing franchise character.  |

Ảnh gia đình, ảnh mục tiêu và ảnh phần thưởng để trống cho đến khi người lớn cung cấp. Các ảnh thật được tải vào Storage private, không nằm trong thư mục `public` hay repository.
