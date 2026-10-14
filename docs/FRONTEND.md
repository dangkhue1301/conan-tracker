# Frontend và tài nguyên

## ConanHabit (14/10/2026)

Thiết kế hiện tại dùng màu và bố cục từ bản TSX tham chiếu của người dùng: bốn thẻ tổng quan, bảng tuần đầy đủ bảy việc và hai biểu đồ phía dưới. `conanhabit.css` bổ sung theme sáng/tối trên token của evondevKit; lịch sử và phân quyền tiếp tục dùng các component có sẵn. Các URL lấy từ lịch đã có hiệu lực ở ngày đang xem.

Avatar hiện tại do người dùng tải lên, không dùng bộ ảnh mẫu bên dưới để lựa chọn. Khung, vũ khí, pet và đồ họa Shop là SVG nguyên bản trong `cosmetics.tsx`. Theo yêu cầu mới, các món trong Shop tĩnh; linh thú có chuyển động nhẹ. Lửa streak và pháo hoa/hạt sáng khi đạt cột mốc vẫn động, có đường dẫn giảm chuyển động bằng CSS. Khung cấp cao có thêm hình dáng, huy hiệu và chi tiết, không chỉ đổi màu.

Coin là tiền nội bộ dùng mua vật phẩm, không kết nối tiền thật hay Robux của Roblox. XP độc lập dùng leo hạng. Đối thủ giải là nhân vật hư cấu, thể hiện trong “Thông tin giải”; avatar và khung được tạo bằng mã trong app, không lấy ảnh trẻ em thật.

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

| File | Prompt / hướng tạo |
| --- | --- |
| `public/avatars/detective.png` | Original friendly teenage boy manga avatar, dark tousled hair and glasses, navy/teal jacket, head and shoulders centered in a pale teal circle, confident and calm, suitable for a 14-year-old, no text/logo/existing franchise character. |
| `public/avatars/football.png` | Matching manga avatar of an original teenage football player with dark hair, navy/teal jersey and a football, centered head and shoulders, pale teal circle, clean and friendly, no text, team logos or existing character. |
| `public/avatars/builder.png` | Original polished 3D block character avatar with dark hair and navy/teal hoodie, sandbox building game inspiration, centered on a pale teal circle, friendly and suitable for a teenager, no text, logos or existing franchise character. |

Ảnh gia đình, ảnh mục tiêu và ảnh phần thưởng để trống cho đến khi người lớn cung cấp. Các ảnh thật được tải vào Storage private, không nằm trong thư mục `public` hay repository.
