# PRD – Website Tuyển sinh Trường THCS & THPT Hồng Hà

> Phiên bản 1.0 · 27/10/2026 · Giao diện chi tiết xem [DESIGN.md](DESIGN.md)
> Nội dung tham khảo: https://thpthongha.com/. Mọi số liệu/thành tích trong tài liệu này là **dữ liệu mẫu**, nhà trường cần xác nhận trước khi công bố.

---

## 1. Tổng quan ứng dụng

**Tên sản phẩm:** Website tuyển sinh Trường THCS & THPT Bán trú – Nội trú Hồng Hà.
**Trụ sở chính:** 170 Quang Trung, Gò Vấp, TP. Hồ Chí Minh.

Website quảng bá trường và thu thập thông tin phụ huynh quan tâm để đội ngũ tuyển sinh liên hệ tư vấn. Website không phải cổng thông tin đầy đủ như thpthongha.com. Mỗi nội dung nằm ở **một trang riêng**, trang chủ chỉ có hình ảnh quảng cáo và lời mời đăng ký tư vấn.

**Các cấp tuyển sinh:** Lớp 6 (vào THCS), lớp 10 (vào THPT), chuyển trường các khối khác.

**Cấu trúc trang (7 trang chính, kèm trang bài viết chi tiết `/hoat-dong/<tên-bài>.html` và trang xác nhận `/cam-on.html`; bản tiếng Anh `/en/` thuộc mục Could):**

| # | Trang | Đường dẫn | Mục đích |
|---|-------|-----------|----------|
| 1 | Trang chủ | `/index.html` | Hình ảnh quảng cáo + kêu gọi đăng ký tư vấn |
| 2 | Giới thiệu trường | `/gioi-thieu.html` | Lịch sử, sứ mệnh, đội ngũ, cơ sở vật chất |
| 3 | Thành tích | `/thanh-tich.html` | Kết quả học tập, giải thưởng, chứng nhận |
| 4 | Chương trình đào tạo & học phí | `/chuong-trinh.html` | Chương trình học, học phí, chính sách |
| 5 | Hoạt động & Tin tức | `/hoat-dong.html` | Sự kiện, ngoại khóa, hình ảnh |
| 6 | Liên hệ | `/lien-he.html` | Địa chỉ, hotline, email, bản đồ |
| 7 | Đăng ký tư vấn | `/dang-ky-tu-van.html` | Form điền thông tin để nhà trường gọi lại |

---

## 2. Mục tiêu ứng dụng

**Mục tiêu kinh doanh**
- Tạo ra nhiều hồ sơ phụ huynh quan tâm (lead) cho mùa tuyển sinh.
- Tăng độ tin cậy và nhận diện thương hiệu của trường trước phụ huynh mới.

**Mục tiêu người dùng**
- Phụ huynh nắm nhanh trường là gì, có thành tích gì, học phí và chương trình ra sao.
- Phụ huynh để lại thông tin trong dưới 1 phút và biết khi nào được liên hệ lại.

**Mục tiêu sản phẩm**
- Tải nhanh và dùng tốt trên điện thoại, vì phần lớn phụ huynh truy cập bằng điện thoại.
- Nhà trường tự cập nhật nội dung và xem danh sách đăng ký mà không cần lập trình viên.
- Chi phí vận hành thấp (host tĩnh miễn phí, lưu dữ liệu bằng Google Sheet).

---

## 3. Đối tượng người dùng và User Stories

### 3.1 Nhóm người dùng

| Nhóm | Mô tả | Thiết bị | Nhu cầu chính |
|------|-------|----------|---------------|
| **Phụ huynh** (chính) | 30–50 tuổi, đang chọn trường cho con vào lớp 6, lớp 10 hoặc chuyển trường | Điện thoại là chủ yếu, máy tính khi so sánh | Tin cậy, học phí, kết quả, cách liên hệ |
| **Học sinh** (phụ) | Học sinh lớp 5, 9 hoặc đang học trường khác | Điện thoại | Xem trường có gì hay, hoạt động ngoại khóa |
| **Nhân viên tuyển sinh** (nội bộ) | Nhận lead và gọi lại tư vấn | Máy tính | Thấy đăng ký mới ngay, đủ thông tin để gọi |

### 3.2 User Stories

**Phụ huynh**
- US-01: Là phụ huynh, tôi muốn thấy ngay trang chủ trường có gì nổi bật để biết có đáng tìm hiểu tiếp không.
- US-02: Tôi muốn xem thành tích của trường để đánh giá chất lượng đào tạo.
- US-03: Tôi muốn xem chương trình học và học phí để cân nhắc khả năng tài chính.
- US-04: Tôi muốn đăng ký tư vấn bằng vài thông tin đơn giản, để không phải gọi điện hay đến trường trước.
- US-05: Tôi muốn thấy xác nhận sau khi gửi, để biết nhà trường đã nhận thông tin.
- US-06: Tôi muốn bấm gọi hotline hoặc xem bản đồ ngay trên điện thoại.

**Học sinh**
- US-07: Là học sinh, tôi muốn xem hình ảnh hoạt động, câu lạc bộ, sự kiện để biết môi trường học như thế nào.

**Nhân viên tuyển sinh**
- US-08: Tôi muốn mỗi đăng ký mới vào một Google Sheet và có email báo, để gọi lại phụ huynh trong ngày.
- US-09: Tôi muốn chương trình, học phí, tin tức dễ sửa, để cập nhật mà không nhờ lập trình viên.

---

## 4. Danh sách chức năng chính

| ID | Chức năng | Mô tả | Ưu tiên |
|----|-----------|-------|---------|
| F-01 | Trang chủ quảng cáo | Banner hình ảnh lớn, khẩu hiệu, nút "Đăng ký tư vấn", form rút gọn (họ tên + SĐT) | **Must** |
| F-02 | Form đăng ký tư vấn đầy đủ | Họ tên phụ huynh, SĐT, email (tùy chọn), tên học sinh, cấp/khối muốn đăng ký, trường hiện tại, ghi chú | **Must** |
| F-03 | Kiểm tra dữ liệu form | Kiểm tra SĐT Việt Nam, bắt buộc điền các trường chính, thông báo lỗi rõ ràng, chống gửi trùng/spam (honeypot) | **Must** |
| F-04 | Lưu đăng ký vào Google Sheet và gửi email thông báo | Form gửi đến Google Apps Script, ghi một dòng vào Sheet và gửi email cho nhà trường | **Must** |
| F-05 | Trang xác nhận | Thông báo "Đã nhận thông tin, nhà trường sẽ liên hệ trong …" | **Must** |
| F-06 | Trang Giới thiệu trường | Lịch sử, sứ mệnh, thông điệp, cơ sở vật chất, nông trại | **Must** |
| F-07 | Trang Thành tích | Số liệu nổi bật, giải thưởng, chứng nhận (ISO, VietGAP…), hình ảnh | **Must** |
| F-08 | Trang Chương trình đào tạo & học phí | Chương trình THCS/THPT, tiếng Anh/IELTS, du học, bảng học phí theo khối | **Must** |
| F-09 | Trang Liên hệ | Địa chỉ, hotline, email, giờ làm việc, bản đồ nhúng | **Must** |
| F-10 | Menu điều hướng và footer | Menu cố định trên mọi trang, menu thu gọn trên điện thoại | **Must** |
| F-11 | Hiển thị tốt trên điện thoại và máy tính | Responsive (360px – 1440px) | **Must** |
| F-12 | Nút gọi nhanh và Zalo nổi | Nút cố định trên điện thoại: gọi hotline / nhắn Zalo | **Should** |
| F-13 | Trang Hoạt động & Tin tức | Danh sách bài viết/sự kiện kèm hình, nội dung lưu dạng JSON/Markdown | **Should** |
| F-14 | SEO cơ bản | Thẻ title/description, Open Graph (chia sẻ Zalo/Facebook), sitemap, dữ liệu có cấu trúc `School` | **Should** |
| F-15 | Theo dõi Google Analytics và sự kiện chuyển đổi | Đếm lượt xem, lượt gửi form theo nguồn | **Should** |
| F-16 | Thư viện ảnh/video giới thiệu | Lightbox ảnh, nhúng video YouTube | **Could** |
| F-17 | Trích dẫn cảm nhận phụ huynh | Một vài lời chia sẻ có tên/ảnh (khi được phép) | **Could** |
| F-18 | Đặt lịch tham quan trường | Chọn ngày giờ tham quan trong form | **Could** |
| F-19 | Chuyển đổi tiếng Anh | Phiên bản tiếng Anh | **Could** |

---

## 5. Non-Goals – không làm ở phiên bản này

- Không có đăng ký hồ sơ trực tuyến đầy đủ, nộp hồ sơ, thanh toán hay thu học phí trực tuyến.
- Không có tài khoản/đăng nhập cho phụ huynh, học sinh hay giáo viên.
- Không có trang quản trị (CMS) hoặc dashboard riêng; nhân viên dùng Google Sheet để xem đăng ký.
- Không có cổng thông tin nội bộ (điểm số, thời khóa biểu, sổ liên lạc).
- Không có tuyển dụng, công khai pháp lý/biểu mẫu như trang thpthongha.com hiện tại.
- Không có chat trực tuyến hoặc chatbot AI (chỉ có nút gọi và Zalo).
- Không có ứng dụng di động riêng.
- Không có đa ngôn ngữ (chỉ tiếng Việt).
- Không có chức năng bình luận hay diễn đàn.

---

## 6. Luồng sử dụng chính

### 6.1 Luồng chính: Phụ huynh đăng ký tư vấn

1. Phụ huynh vào website (từ Google, Facebook, Zalo hoặc quảng cáo) và vào **Trang chủ**.
2. Xem banner quảng cáo, khẩu hiệu và điểm nổi bật.
3. Chọn một trong hai cách:
   a. Điền nhanh họ tên + SĐT ở form rút gọn trên trang chủ, hoặc
   b. Bấm nút "Đăng ký tư vấn" để qua trang **Đăng ký tư vấn** (form đầy đủ).
4. Điền họ tên, SĐT, tên học sinh, chọn cấp/khối (lớp 6 / lớp 10 / chuyển trường), ghi chú nếu có.
5. Bấm "Gửi đăng ký". Hệ thống kiểm tra dữ liệu và hiện lỗi cạnh trường sai (nếu có).
6. Dữ liệu hợp lệ được gửi lên Google Apps Script, ghi vào Google Sheet và gửi email cho nhà trường.
7. Phụ huynh thấy **trang xác nhận** "Cảm ơn quý phụ huynh, chúng tôi sẽ liên hệ trong vòng 24 giờ làm việc".
8. Nhân viên tuyển sinh nhận email, mở Sheet và gọi lại tư vấn.

### 6.2 Luồng phụ: Phụ huynh tìm hiểu trước khi đăng ký

1. Từ **Trang chủ**, vào menu và chọn trang cần xem: Giới thiệu, Thành tích, Chương trình & học phí, Hoạt động.
2. Đọc nội dung từng trang; cuối mỗi trang có khối kêu gọi "Đăng ký tư vấn miễn phí".
3. Bấm vào khối đó và tiếp tục từ bước 4 của luồng chính.

### 6.3 Luồng phụ: Liên hệ trực tiếp

1. Phụ huynh vào trang **Liên hệ** hoặc bấm nút gọi nổi.
2. Bấm số hotline để gọi, hoặc bấm bản đồ để chỉ đường đến 170 Quang Trung, Gò Vấp.

### 6.4 Luồng lỗi

- Mất mạng/gửi thất bại: hiện thông báo "Chưa gửi được, vui lòng thử lại hoặc gọi hotline …", giữ nguyên dữ liệu đã điền.
- SĐT sai định dạng: báo lỗi ngay dưới trường SĐT.

---

## 7. Giao diện dự kiến

Chi tiết màu sắc, chữ, bố cục, thành phần xem **[DESIGN.md](DESIGN.md)**.

| Màn hình | Thành phần chính | Mục DESIGN liên quan |
|----------|------------------|----------------------|
| Trang chủ | Header + menu, banner hero ảnh lớn, khẩu hiệu, nút CTA, form rút gọn, dải điểm nổi bật, khối CTA cuối trang, footer | §4 Bố cục, §6 Hero/Button/Form, §10.9 |
| Giới thiệu trường | Ảnh bìa, đoạn mở đầu, sứ mệnh/tầm nhìn/giá trị, timeline, thông điệp Hiệu trưởng, đội ngũ, lưới ảnh cơ sở vật chất | §6 Card, §7 Hình ảnh, §10.2 |
| Thành tích | Dãy số liệu nổi bật, timeline giải thưởng, huy hiệu chứng nhận, cảm nhận phụ huynh | §6 Stat, Timeline, §10.5, §10.10 |
| Chương trình & học phí | Tab theo cấp học, thẻ chương trình, bảng học phí, khối chính sách/học bổng | §6 Tab, Table, §10.10 |
| Hoạt động & Tin tức | Chip lọc, thẻ nổi bật, lưới thẻ bài viết, nút "Xem thêm", thư viện ảnh/video, lightbox | §6 Card, §10.3, §10.4 |
| Bài viết chi tiết | Breadcrumb, ảnh bìa, nội dung, nút chia sẻ, bài liên quan | §10.3.2 |
| Liên hệ | Thẻ thông tin liên hệ, giờ làm việc, bản đồ nhúng, các cơ sở, nút gọi/Zalo/chỉ đường | §6 Button, §7 Biểu tượng, §10.1 |
| Đăng ký tư vấn | Form đầy đủ, khối đặt lịch tham quan (tùy chọn), thông báo lỗi | §6 Form, §9 Trạng thái, §10.6 |
| Xác nhận đăng ký | Biểu tượng thành công, thẻ tóm tắt thông tin đã gửi, các bước tiếp theo, nút điều hướng | §9.2, §10.8 |
| Chuyển ngôn ngữ (Could) | Bộ chuyển VI \| EN ở header, các trang `/en/` | §10.7 |
| Giao diện nội bộ | Google Sheet đăng ký (cột, trạng thái màu) và email thông báo cho nhân viên tuyển sinh | §10.11 |

**Nguyên tắc:** mobile-first, một nút CTA rõ ràng ở mỗi màn hình, mỗi trang chỉ nói một chủ đề.

---

## 8. Ràng buộc kỹ thuật

| Hạng mục | Quyết định |
|----------|-----------|
| Công nghệ | HTML5, CSS3, JavaScript thuần (không framework), nhiều trang tĩnh |
| Lưu trữ đăng ký | Form gửi (`fetch`) tới **Google Apps Script Web App**, ghi vào **Google Sheet** và gửi email thông báo qua `MailApp` |
| Hosting | Host tĩnh miễn phí (GitHub Pages / Netlify / Cloudflare Pages), HTTPS bắt buộc, tên miền do nhà trường cung cấp |
| Trình duyệt | Chrome, Safari, Edge, Samsung Internet bản mới (2 phiên bản gần nhất); iOS 15+ và Android 9+ |
| Responsive | Mobile-first; điểm ngắt 360 / 768 / 1024 / 1440px |
| Hiệu năng | Lighthouse Mobile ≥ 85 (Performance), LCP < 2,5 giây trên 4G; ảnh WebP, `loading="lazy"`, mỗi trang < 1,5 MB |
| Khả năng truy cập | Độ tương phản WCAG AA, điều hướng bằng bàn phím, `alt` cho ảnh, nhãn cho mọi trường form |
| Bảo mật & quyền riêng tư | Chỉ thu thập dữ liệu cần thiết; có ghi chú đồng ý xử lý dữ liệu cá nhân (theo Nghị định 13/2023/NĐ-CP); honeypot + giới hạn tần suất gửi; không lưu dữ liệu ở trình duyệt; Sheet chỉ chia sẻ cho nhân viên được phép |
| SEO | Một thẻ `<h1>` mỗi trang, meta tag, Open Graph, `sitemap.xml`, `robots.txt`, dữ liệu có cấu trúc; thẻ `hreflang` nếu có bản `/en/`; trang `cam-on.html` đặt `noindex` |
| Nội dung | Tiếng Việt; nội dung và ảnh do nhà trường cung cấp, ảnh mẫu dùng tạm trong giai đoạn dựng |
| Cấu trúc thư mục | `index.html`, các trang `.html` (gồm `cam-on.html`), `/hoat-dong/` (bài viết chi tiết), `/en/` (bản tiếng Anh, mục Could), `/css`, `/js`, `/images`, `/data` (tin tức dạng JSON) |
| Giới hạn đã biết | Google Apps Script có giới hạn số email/ngày (~100 với tài khoản thường); cần theo dõi nếu lượng đăng ký lớn |

**Cần nhà trường xác nhận:** địa chỉ email nhận thông báo, hotline/Zalo dùng cho tuyển sinh, tên miền, logo và ảnh gốc, bảng học phí, số liệu thành tích chính thức, năm học tuyển sinh.

---

## 9. Tiêu chí thành công (Success Metrics)

| Chỉ số | Mục tiêu 3 tháng đầu | Cách đo |
|--------|---------------------|---------|
| Tỷ lệ chuyển đổi (khách truy cập → gửi form) | ≥ 3% | Google Analytics sự kiện `form_submit` ÷ phiên truy cập |
| Số lượt đăng ký tư vấn | ≥ 150 lượt (điều chỉnh theo lưu lượng quảng cáo) | Số dòng trong Google Sheet |
| Tỷ lệ hoàn thành form | ≥ 60% (người bắt đầu điền → gửi) | Sự kiện `form_start` so với `form_submit` |
| Thời gian điền form | < 60 giây | Khảo sát thử với 5–10 phụ huynh |
| Tỷ lệ truy cập từ điện thoại dùng tốt | Tỷ lệ thoát trên mobile < 60% | Google Analytics |
| Tốc độ tải | LCP < 2,5 giây, Lighthouse Mobile ≥ 85 | Lighthouse / PageSpeed Insights |
| Thời gian phản hồi của nhà trường | Gọi lại ≤ 24 giờ làm việc cho ≥ 90% đăng ký | Cột "Trạng thái/Ngày gọi" trong Sheet |
| Tỷ lệ gửi form lỗi | < 1% | Nhật ký Apps Script và sự kiện `form_error` |
| Hài lòng của nhà trường | Nhân viên tuyển sinh xác nhận dùng được hằng ngày | Phản hồi sau 1 tháng |

---

## Phụ lục – Câu hỏi còn mở

1. Năm học và thời hạn tuyển sinh cần hiện trên banner là gì?
2. Học phí có được công khai trên website không, hay chỉ hiện "liên hệ tư vấn"?
3. Hotline và Zalo dùng riêng cho tuyển sinh là số nào? (thpthongha.com ghi 0902 793 727 và 1800 577763.)
4. Trường có bộ nhận diện (logo, màu chính thức) không? DESIGN.md đang đề xuất màu tạm.
5. Có cần hiện cả 3 cơ sở trên trang Liên hệ không?
