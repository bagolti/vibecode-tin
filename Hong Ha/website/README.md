# Module 1 – Trang Thành tích & Thông tin tổng quan

Website tuyển sinh Trường THCS & THPT Hồng Hà. Module này xây **trang `thanh-tich.html`** (PRD F-07) theo DESIGN §4.4, §6.6, §6.7, §10.4, §10.5, §10.10. Chưa đụng tới các module khác.

## Mở trang
Mở thẳng file `thanh-tich.html` bằng trình duyệt (không cần server, không cần build). Không dùng module ES nên chạy được qua `file://`.

## Cấu trúc

| Tệp | Vai trò |
|---|---|
| `thanh-tich.html` | Trang (h1 duy nhất, meta/OG, khối CTA cuối trang) |
| `js/achievements-data.js` | **Nội dung** do nhà trường chỉnh (số liệu, mốc, chứng nhận, cảm nhận) |
| `js/achievements-model.js` | Logic thuần: làm sạch dữ liệu, chặn URL nguy hiểm, định dạng số, tính đếm số |
| `js/achievements-view.js` | Dựng DOM: số liệu, timeline, huy hiệu, lightbox, carousel cảm nhận, hiệu ứng |
| `js/achievements-page.js` | Khởi động trang |
| `css/base.css` | Token DESIGN (màu, chữ, khoảng cách, bóng, bo góc) + **khung trang tạm** |
| `css/achievements.css` | Kiểu riêng của module |
| `js/site-shell.js` | Đổ bóng header khi cuộn (khung tạm) |

> **Khung trang tạm:** header, menu thu gọn, footer, khối CTA trong `thanh-tich.html`/`base.css` chỉ là giàn giáo tối thiểu để trang chạy độc lập. Module Menu/Footer sẽ thay thế; module này không phụ thuộc vào chúng.

## Cập nhật nội dung
Sửa `js/achievements-data.js` (có chú thích quy tắc ở đầu file). Dữ liệu sai sẽ được **bỏ qua từng mục** và cảnh báo trong console (`[Thành tích] …`), không làm hỏng cả trang.

- `stats[].plain: true` – không chèn dấu chấm ngăn cách (dùng cho năm: "1997").
- `certifications[].image` – có ảnh giấy chứng nhận thì huy hiệu thành nút mở lightbox.
- `testimonials[]` – chỉ hiện khi `consent: true`. **Đang để rỗng** vì chưa có lời chia sẻ thật; mục này tự ẩn.

## Chạy kiểm thử
```
npm install        # puppeteer-core + axe-core
npm test           # 110 test đơn vị + 107 test đầu-cuối
npm run test:unit  # chỉ logic (không cần trình duyệt)
```
- Test e2e dùng **Chrome/Edge có sẵn** (tự tìm; hoặc đặt `CHROME_PATH`). Không tìm thấy thì e2e bị `skip` kèm thông báo.
- Nếu `npm install` lỗi trên ổ Google Drive (`EBADF`), cài ở thư mục khác rồi trỏ tới: `HONGHA_TEST_DEPS=<thư mục có node_modules> npm test`.
- Chụp ảnh kiểm tra bằng mắt: đặt `HONGHA_SHOTS=<thư mục>` khi chạy e2e.

## Quyết định thiết kế đáng chú ý
- **Số liệu co nhẹ trên màn hình hẹp:** DESIGN nêu 40–56px. Ở ≤ 380px ô 2 cột chỉ rộng ~122px nên cỡ chữ co theo `10.5vw` (37,8px ở 360px); ở 1024–1219px co theo `4.6vw`. Nếu không "60.000" bị ngắt giữa chừng.
- **Tiền tố/hậu tố** ("Từ", "+ m²") nhỏ hơn số (0,5em / 0,4em) để ô không ngắt dòng xấu.
- **Nội dung dựng bằng JS** (dễ cập nhật, an toàn XSS vì chỉ dùng `textContent`). Đổi lại, nội dung không có trong HTML tĩnh cho SEO/không JS; `<noscript>` chỉ hiện hotline. Nếu SEO cho trang này quan trọng, nên thêm bước build tạo HTML tĩnh.
- Biểu tượng là SVG inline theo phong cách Lucide, viết tay; thay bằng bộ chính thức khi có.

## Cần nhà trường xác nhận (PRD §8)
Số liệu và mốc trong `achievements-data.js` tổng hợp từ thpthongha.com để dựng giao diện, **chưa phải số liệu chính thức**; hotline `0902 793 727` và email cũng lấy từ trang đó. Cần: số liệu chính thức, ảnh giấy chứng nhận, lời chia sẻ phụ huynh (kèm đồng ý), logo.
