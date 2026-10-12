# Góc của Conan

Website nhỏ để Conan nhớ việc cần làm, tự ghi nhận và cùng người hướng dẫn nhìn lại sự tiến bộ. Frontend React + TypeScript + Vite; GitHub Pages phục vụ website, Supabase lưu dữ liệu và đăng nhập Google. Giao diện dựa trên [evondevKit](https://github.com/evondev/evondevKit); cách áp dụng ghi trong [docs/FRONTEND.md](docs/FRONTEND.md).

## Chạy thử ngay trên máy

Cài Node.js 24 LTS, rồi mở terminal **trong folder `conan-tracker`**:

```powershell
npm ci
npm run dev
```

Mở [bản minh hoạ](http://127.0.0.1:5173/?demo=1). Không cần tài khoản Supabase. Thanh đầu trang cho đổi vai Conan / người hướng dẫn / ba mẹ để kiểm tra từng màn. Dữ liệu mẫu chỉ lưu trong trình duyệt của máy đó, không đồng bộ sang hệ thống thật. Lịch mẫu đã mở cả sáu việc để xem được phần ôn bài; bản thật khởi đầu ở giai đoạn 1 với bốn việc.

Đóng terminal hoặc nhấn `Ctrl+C` để dừng. Đây là app cần chạy bằng server; không mở `index.html` trực tiếp bằng cách nhấp đôi.

```powershell
npm test
npm run build
npm run preview
```

## Những gì đã có

- **Hôm nay:** tick làm đủ; menu chọn làm ít nhất / làm thêm / bỏ ghi nhận; mở URL học khi đã điền; ôn bài cần một dòng ghi chú.
- **Tiến độ:** bảng từ thứ Hai đến Chủ nhật, xem lại ngày, xu hướng 4/8/12 tuần, những việc hay quên, tổng kết tuần và mức cần nhắc.
- **Điều em hướng tới:** tối đa hai mục tiêu với các mốc cùng xác nhận, ảnh nếu đã có, lời nhắn thật từ người lớn, phần thưởng ẩn cho đến khi được bật.
- **Cá nhân hoá:** ba avatar theo sở thích thám tử manga, bóng đá, nhân vật khối; bốn màu nhấn. Ảnh gia đình do người lớn thêm sau.
- **Quản lý:** lịch theo từng thứ, mức ít nhất/làm đủ, URL học, mở từng giai đoạn, cho nghỉ một ngày, tên gọi/ảnh gia đình và phần thưởng.

URL các website học hiện tại chưa được cung cấp nên để trống. Tracker ghi nhận bằng tay; nó không lấy kết quả hay khoá Roblox/Shorts từ website khác. Đọc/viết có thể thêm URL về sau; phần viết được thực hiện ở website học, không có trình soạn bài trong tracker.

## Thiết lập dùng thật

Bạn cần tạo một dự án Supabase và một repository GitHub mới. Không cần mua domain. Hướng dẫn sau dùng repository tên `conan-tracker`, ví dụ website ở `https://TEN-GITHUB.github.io/conan-tracker/`.

### 1. Tạo Supabase và cơ sở dữ liệu

1. Tạo dự án riêng tại [Supabase](https://supabase.com/dashboard). Giữ mật khẩu database ở tài khoản của bạn.
2. Mở **SQL Editor**, tạo query mới, dán và chạy toàn bộ [supabase/migrations/001_tracker.sql](supabase/migrations/001_tracker.sql). File tạo bảng, quyền truy cập, các hàm lưu, kho ảnh riêng và đăng ký Realtime; chưa có dữ liệu cá nhân hay lịch sử giả.
3. Mở [supabase/allowlist.example.sql](supabase/allowlist.example.sql), thay **toàn bộ** email ví dụ bằng email Google thật của người hướng dẫn, Conan, ba và mẹ. Chạy bản đã sửa trong SQL Editor. Không đưa bản chứa email thật lên GitHub.
4. Trong cài đặt API của dự án, lấy **Project URL** và **publishable key** (`sb_publishable_…`). Dự án cũ có thể dùng legacy `anon` key. Hai giá trị này dùng cho frontend; quyền truy cập thực sự do RLS và các hàm có kiểm tra vai thực thi. Xem [hướng dẫn API keys](https://supabase.com/docs/guides/api/api-keys).

Không đưa `service_role`, `sb_secret_…`, mật khẩu database hoặc Google Client Secret vào `.env` frontend, GitHub variables hay mã nguồn. Các khoá này không cần để app chạy.

### 2. Bật đăng nhập Google

Tạo OAuth client loại **Web application** trong Google Cloud / Google Auth Platform. Cấu hình tên app và quyền cơ bản `openid`, email, profile; nếu dùng chế độ Testing, thêm các tài khoản gia đình vào Test users.

- **Authorized JavaScript origins:** `http://127.0.0.1:5173` và `https://TEN-GITHUB.github.io`.
- **Authorized redirect URI:** sao chép callback hiển thị ở mục Google provider của Supabase, thường là `https://MA-DU-AN.supabase.co/auth/v1/callback`.
- Trong Supabase **Authentication → Sign In / Providers → Google**, bật Google và điền Client ID / Client Secret. Secret chỉ ở Supabase.

Đây là cấu hình cho đăng nhập chuyển hướng; xem [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google) và [Google OAuth web server](https://developers.google.com/identity/protocols/oauth2/web-server).

Trong Supabase **Authentication → URL Configuration**:

```text
Site URL: https://TEN-GITHUB.github.io/conan-tracker/
Redirect URLs:
http://127.0.0.1:5173/
https://TEN-GITHUB.github.io/conan-tracker/
```

Giữ dấu `/` cuối và đúng tên repo. Callback của Google đi tới Supabase; sau đó Supabase trả về website. Các URL này có vai trò khác nhau. Xem [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

Chỉ bật Google provider cho app này; tắt đăng nhập email/password và anonymous nếu không dùng. Email ngoài danh sách có thể xác thực Google nhưng vẫn bị từ chối dữ liệu bởi cơ sở dữ liệu.

### 3. Kết nối app trên máy

```powershell
Copy-Item .env.example .env.local
```

Mở `.env.local` và điền:

```dotenv
VITE_SUPABASE_URL=https://MA-DU-AN.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_THAY_BANG_KEY_CUA_BAN
VITE_BASE_PATH=/
```

Chạy lại `npm run dev`, mở `http://127.0.0.1:5173/` **không có `?demo=1`**. Người hướng dẫn đăng nhập đầu tiên, nhập tên gọi và ngày bắt đầu. App tạo lịch giai đoạn 1, không chuyển dữ liệu mẫu sang dùng thật.

Mở **Quản lý** để điền URL Anki/ngữ pháp/tính nhẩm và chỉnh giờ nếu cần. Thay đổi lịch bắt đầu từ ngày mai hoặc ngày tương lai bạn chọn, để yêu cầu cũ được giữ đúng khi xem lại lịch sử.

### 4. Đưa lên GitHub Pages

Chỉ đưa **nội dung trong `conan-tracker`** vào repository mới. File gốc `lich-hoc-tuan.md` ở folder cha chứa thông tin riêng và không thuộc app. `.env.local`, `node_modules`, cache và kết quả QA đã được bỏ qua bởi `.gitignore`; vẫn kiểm tra danh sách file trước khi push.

Tạo repo trống tên `conan-tracker`, mở terminal ở folder app rồi dùng URL GitHub thật của bạn:

```powershell
git init -b main
git add .
git status
git commit -m "Build Conan habit tracker"
git remote add origin https://github.com/TEN-GITHUB/conan-tracker.git
git push -u origin main
```

1. Repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**, thêm hai repository variables:
   - `VITE_SUPABASE_URL`: URL dự án.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: publishable key hoặc legacy anon key.
3. Mở **Actions → Check and deploy to GitHub Pages → Run workflow**. Workflow chạy test trước, rồi build và deploy `dist`. Workflow không chạy SQL hay cần database secret.
4. Sau khi deploy thành công, mở URL Pages hiển thị ở workflow và kiểm tra lại nó trùng URL Configuration của Supabase.

Workflow tự đặt base path thành `/TEN-REPO/`. Với repo `TEN-GITHUB.github.io` nó dùng `/`. Nếu dùng custom domain, đặt repository variable `VITE_BASE_PATH=/` và cập nhật redirect URLs tương ứng. Vite cần đúng base để CSS/JS/avatar chạy dưới đường dẫn repo. Xem [Vite: GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages).

GitHub Pages trên gói GitHub Free thường dùng repository public; **mã nguồn được công khai nhưng dữ liệu Supabase vẫn cần tài khoản được phép**. Không đính kèm ảnh gia đình, email thật hay bản SQL đã điền thông tin riêng vào source. Xem [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).

### 5. Kiểm tra sau khi cấu hình

- Người hướng dẫn khởi tạo góc học tập; Conan thấy đúng bốn việc đầu tiên và tự đổi avatar/màu được.
- Conan tick một việc, tải lại, rồi đăng nhập trên thiết bị khác: cùng thấy kết quả.
- Ba/mẹ xem được tiến độ và gửi lời nhắn; không sửa được checklist, lịch hay mục tiêu.
- Email chưa có trong `memberships` không đọc được dữ liệu.
- Khi bật giai đoạn 3 từ một ngày tương lai, mục ôn bài hiện đúng ngày đó và yêu cầu ghi chú trước khi tick.
- Ảnh gia đình trong Storage bucket `family-assets` vẫn là **private**.

Các bước trên cần dự án và tài khoản thật để xác nhận. Bản bàn giao chưa chạy Google OAuth, Supabase Realtime trên Internet hoặc workflow GitHub Pages trên tài khoản của bạn.

## Quy tắc sử dụng và tính tiến độ

| Vai | Được làm |
| --- | --- |
| Conan (`learner`) | Xem tiến độ/mục tiêu/lời nhắn, chọn avatar/màu, tick và sửa ghi chú trong tuần hiện tại đến hôm nay |
| Người hướng dẫn (`mentor`) | Xem/sửa ngày đã qua, cấu hình kế hoạch từ tương lai, cho nghỉ, tổng kết, quản lý mục tiêu/phần thưởng/ảnh, gửi lời nhắn |
| Ba mẹ (`parent`) | Xem tiến độ/mục tiêu đang hiện, gửi ảnh và lời nhắn; gỡ lời nhắn của mình |

Giai đoạn 1: Anki, ngữ pháp, tính nhẩm, đọc. Giai đoạn 2 thêm viết; giai đoạn 3 thêm ôn bài. Người hướng dẫn tự quyết định ngày chuyển; app không tự mở thêm việc dựa vào điểm số.

| Việc | Ít nhất | Làm đủ |
| --- | ---: | ---: |
| Anki | Không tách mức | 10 phút |
| Ngữ pháp | 20 câu | 30 câu |
| Tính nhẩm | 6 phút | 8 phút |
| Đọc sách chữ | 4 trang | 5 trang |
| Viết | 4 câu | 6 câu |
| Ôn bài | 20 phút + ghi chú | 30 phút + ghi chú |

Tuần tính theo giờ Việt Nam, thứ Hai–Chủ nhật. Mỗi lần làm ít nhất/làm đủ/làm thêm tính **một** lượt duy trì; làm thêm không tăng tỷ lệ trên 100%. Mẫu số là mọi lượt theo lịch **cả tuần**, từ ngày bắt đầu; ngày được nghỉ không tính. Tuần đang chạy hiển thị tiến độ tích luỹ, không xem các ngày chưa đến là bỏ sót. Giai đoạn 3 hướng tới 80%, tương đương làm tròn lên số lượt cần duy trì.

Ngày đã qua chỉ dùng phiên bản kế hoạch có hiệu lực vào ngày đó. Ghi nhận lưu số phiên bản; khi hai thiết bị sửa cùng một kết quả, bản cũ bị từ chối thay vì ghi đè. Với ghi chú đang nhập, app cho chọn dùng nội dung vừa cập nhật hoặc giữ bản đang nhập trước khi lưu lại.

Nên ghim trang **Hôm nay** làm bookmark hoặc trang khởi động trình duyệt để gắn với giờ ngồi vào bàn. Cuối tuần cùng Conan chọn một điều đã làm tốt và một thay đổi nhỏ; xem thêm mức “cần nhắc ít hơn / tương đương / nhiều hơn”. App không chấm điểm trung thực, không phạt, không có bảng xếp hạng hay thông báo đẩy.

## Lỗi thường gặp

- **Không có nút Google:** thiếu một trong hai biến môi trường; chạy lại dev server hoặc chạy lại workflow sau khi đổi variables.
- **Redirect mismatch / quay sai trang:** kiểm tra Google callback, Site URL, Redirect URLs và dấu `/` cuối theo đúng hai hệ thống ở trên.
- **Tài khoản chưa được phép:** email trong `memberships` phải là email Google đang đăng nhập, chữ thường và đúng vai. Sửa bằng SQL Editor.
- **Mất CSS hoặc avatar sau deploy:** base path sai hoặc repo được đổi tên; chạy lại workflow và cập nhật URL đăng nhập.
- **Dữ liệu vừa cập nhật ở nơi khác:** xem bản mới rồi lưu lại; app không tự ghi đè kết quả đã đổi.
- **Supabase không phản hồi sau thời gian không dùng:** kiểm tra Dashboard, dự án Free có thể bị pause sau một tuần không hoạt động; resume rồi thử lại. Điều kiện có thể thay đổi, xem [Supabase pricing](https://supabase.com/pricing).
- **Muốn làm mới dữ liệu minh hoạ:** mở DevTools → Application → Local Storage và xoá riêng key `conan-tracker-demo-v1`. Việc này không xoá dữ liệu dùng thật.

## Bảo trì mã nguồn

`src/defaults.ts` chứa cấu hình khởi đầu; không thay nó để sửa lịch của một app đã hoạt động, hãy dùng màn Quản lý. `src/domain.ts` tính ngày/tỷ lệ; `src/repository.ts` nối demo/Supabase. `supabase/migrations/001_tracker.sql` là schema và lớp kiểm tra quyền. Thư mục `tests` kiểm tra quy tắc sản phẩm, repository và migration trên PostgreSQL cục bộ qua PGlite. Chi tiết kiểm tra và giới hạn trong [docs/VERIFICATION.md](docs/VERIFICATION.md).

Sau khi chỉnh mã, dùng `npm run format` để định dạng và `npm test` / `npm run build` để kiểm tra. Workflow kiểm tra cả định dạng trước khi deploy.

Đây là app cho **một Conan và một nhóm gia đình/người hướng dẫn**. Nếu sau này muốn nhiều học sinh, cần thêm family/student ID vào schema và RLS trước khi tái sử dụng cùng database. Mỗi môi trường thử nghiệm nên dùng dự án Supabase riêng.
