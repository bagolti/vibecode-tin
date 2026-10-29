# DESIGN – Website Tuyển sinh Trường THCS & THPT Hồng Hà

> Đi kèm [PRD.md](PRD.md). Màu và phông là **đề xuất tạm**; cập nhật khi nhà trường cung cấp bộ nhận diện thương hiệu.

---

## 1. Tổng quan

**Cảm giác thương hiệu:** tin cậy, ấm áp, trẻ trung, gần gũi thiên nhiên (trường có nông trại hữu cơ). Phụ huynh cần cảm giác an tâm; học sinh cần cảm giác năng động.

**Nguyên tắc thiết kế**
1. **Mobile-first:** thiết kế cho màn hình 360px trước, mở rộng lên máy tính.
2. **Một trang một việc:** mỗi trang một chủ đề, một nút kêu gọi hành động (CTA) chính.
3. **Ảnh thật dẫn dắt:** ảnh học sinh, thầy cô, trường lớp chiếm vai trò chính, chữ ngắn gọn.
4. **Dễ đọc cho phụ huynh:** chữ đủ lớn, tương phản cao, câu ngắn.
5. **Đăng ký luôn trong tầm tay:** nút "Đăng ký tư vấn" luôn nhìn thấy ở header và cuối mỗi trang.

**Giọng văn:** lịch sự, thân thiện, xưng "nhà trường" – "quý phụ huynh". Khẩu hiệu gợi ý: *"Tất cả vì học sinh thân yêu"*.

---

## 2. Màu sắc

### 2.1 Bảng màu

| Vai trò | Tên | Mã HEX | Dùng cho |
|---------|-----|--------|----------|
| Primary | Xanh Hồng Hà | `#1B4F8F` | Header, tiêu đề, liên kết, nút phụ |
| Primary tối | Xanh navy | `#12365F` | Footer, hover nút phụ, chữ tiêu đề lớn |
| Secondary | Xanh lá nông trại | `#2E8B57` | Huy hiệu, icon, điểm nhấn "xanh/sạch" |
| Accent / CTA | Cam ấm | `#F28C28` | Nút "Đăng ký tư vấn", điểm nhấn quan trọng |
| Accent tối | Cam đậm | `#D9730D` | Hover/nhấn của nút CTA |
| Nền chính | Trắng | `#FFFFFF` | Nền trang |
| Nền phụ | Xám xanh nhạt | `#F3F7FB` | Các khối xen kẽ, nền thẻ |
| Chữ chính | Than | `#1F2933` | Nội dung |
| Chữ phụ | Xám | `#52606D` | Mô tả, ghi chú |
| Viền | Xám nhạt | `#D9E2EC` | Viền thẻ, trường nhập |

### 2.2 Màu trạng thái

| Trạng thái | Mã HEX | Nền nhạt |
|-----------|--------|----------|
| Thành công | `#1E8E4E` | `#E6F5EC` |
| Lỗi | `#C62828` | `#FDECEA` |
| Cảnh báo | `#B26A00` | `#FFF4E0` |
| Thông tin | `#1B4F8F` | `#E8F1FB` |

### 2.3 Quy tắc dùng màu
- Màu cam chỉ dành cho **CTA chính** (tối đa một nút cam nổi bật trong mỗi màn hình đầu tiên).
- Chữ trắng trên nền `#1B4F8F` đạt WCAG AA. Chữ trắng trên cam `#F28C28` chỉ dùng chữ **đậm ≥ 18px**; ưu tiên dùng chữ `#12365F` trên nền cam cho nút nhỏ.
- Tỷ lệ gợi ý: 60% trắng/xám nhạt – 30% xanh – 10% cam.
- Hỗ trợ giao diện sáng; chưa làm giao diện tối ở phiên bản này.

---

## 3. Chữ viết

**Phông:** *Be Vietnam Pro* (Google Fonts) – hỗ trợ tiếng Việt đầy đủ dấu, dễ đọc trên màn hình nhỏ. Dự phòng: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

Trọng lượng dùng: 400 (nội dung), 500 (nhãn), 600 (tiêu đề nhỏ), 700 (tiêu đề lớn, nút).

### 3.1 Thang cỡ chữ

| Cấp | Mobile | Desktop | Trọng lượng | Dòng cao |
|-----|--------|---------|-------------|----------|
| Display (hero) | 32px | 52px | 700 | 1.15 |
| H1 | 28px | 40px | 700 | 1.2 |
| H2 | 24px | 32px | 700 | 1.25 |
| H3 | 20px | 24px | 600 | 1.3 |
| Body lớn | 18px | 18px | 400 | 1.6 |
| Body | 16px | 16px | 400 | 1.6 |
| Nhỏ / chú thích | 14px | 14px | 400 | 1.5 |
| Nút | 16px | 16px | 700 | 1 |

### 3.2 Quy tắc
- Chữ nội dung tối thiểu **16px** để tránh trình duyệt điện thoại tự phóng to ô nhập.
- Độ dài dòng 55–75 ký tự; đoạn văn không quá 4 dòng trên mobile.
- Căn trái cho đoạn văn; chỉ căn giữa cho tiêu đề ngắn và khối CTA.
- Số liệu thành tích dùng cỡ lớn (40–56px, đậm, màu Primary).
- Mỗi trang có một `<h1>` duy nhất.

---

## 4. Khoảng cách & Bố cục

### 4.1 Đơn vị khoảng cách (lưới 8px)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96` px

| Vị trí | Mobile | Desktop |
|--------|--------|---------|
| Lề hai bên trang | 16px | 24px |
| Khoảng giữa các khối (section) | 48px | 96px |
| Khoảng trong thẻ (padding) | 16px | 24px |
| Khoảng giữa các thẻ | 16px | 24px |

### 4.2 Lưới và điểm ngắt

| Thiết bị | Rộng | Cột | Ghi chú |
|----------|------|-----|---------|
| Điện thoại | 360–767px | 1 cột | Mặc định |
| Máy tính bảng | 768–1023px | 2 cột | Menu vẫn thu gọn |
| Máy tính | 1024–1439px | 12 cột | Menu ngang |
| Màn hình lớn | ≥ 1440px | 12 cột | Nội dung tối đa **1200px**, căn giữa |

### 4.3 Khung trang chung

```
┌────────────────────────────────┐
│ Header: Logo | Menu | [Đăng ký]│  cố định khi cuộn, cao 64px
├────────────────────────────────┤
│ Nội dung trang (các khối)      │
│  ...                           │
├────────────────────────────────┤
│ Khối CTA: "Đăng ký tư vấn"     │  trừ trang Đăng ký
├────────────────────────────────┤
│ Footer: địa chỉ, hotline, menu │
└────────────────────────────────┘
        (Nút gọi/Zalo nổi – mobile)
```

### 4.4 Bố cục từng trang

- **Trang chủ:** Hero toàn chiều rộng (ảnh nền + lớp phủ xanh đậm 50%, khẩu hiệu, nút CTA cam, form rút gọn: họ tên + SĐT). Dưới hero chỉ có một dải ngắn 3–4 điểm nổi bật (biểu tượng + 1 dòng), mỗi điểm liên kết đến trang riêng, rồi đến khối CTA và footer. **Không liệt kê đầy đủ nội dung các trang.**
- **Giới thiệu:** ảnh bìa → đoạn mở đầu → sứ mệnh → cơ sở vật chất (lưới ảnh) → CTA.
- **Thành tích:** dải số liệu lớn → timeline giải thưởng theo năm → chứng nhận → CTA.
- **Chương trình & học phí:** tab chuyển giữa lớp 6 / lớp 10 / chuyển trường → danh sách chương trình → bảng học phí → CTA.
- **Hoạt động & Tin tức:** lưới thẻ bài viết (1 cột mobile, 3 cột desktop).
- **Liên hệ:** thông tin bên trái, bản đồ bên phải (xếp dọc trên mobile).
- **Đăng ký tư vấn:** một cột, rộng tối đa 560px, căn giữa; cạnh form (desktop) có khối lợi ích ngắn.

---

## 5. Hình khối & Chiều sâu

### 5.1 Bo góc

| Thành phần | Bán kính |
|-----------|----------|
| Nút, ô nhập | 8px |
| Thẻ, khối ảnh | 16px |
| Hero (góc dưới) | 0 mobile / 24px desktop |
| Huy hiệu, nhãn, avatar | 999px (tròn) |

### 5.2 Đổ bóng

| Mức | CSS | Dùng cho |
|-----|-----|----------|
| 0 | không bóng | Nền phẳng, khối liền kề |
| 1 | `0 1px 3px rgba(18,54,95,.12)` | Thẻ ở trạng thái thường |
| 2 | `0 6px 16px rgba(18,54,95,.14)` | Thẻ hover, header khi cuộn |
| 3 | `0 12px 32px rgba(18,54,95,.18)` | Form nổi trên hero, hộp thoại |

### 5.3 Viền và lớp phủ
- Viền 1px `#D9E2EC` cho thẻ và ô nhập.
- Ảnh hero có lớp phủ gradient xanh đậm `rgba(18,54,95,.65) → rgba(18,54,95,.25)` để chữ trắng dễ đọc.
- Khối xen kẽ dùng nền `#F3F7FB`, **không** đổ bóng thêm.
- Tránh dùng quá 2 mức đổ bóng trên cùng một màn hình.

### 5.4 Thứ tự lớp (z-index)
Nội dung 0 · Header 100 · Nút gọi/Zalo nổi 200 · Menu mobile 300 · Hộp thoại/lightbox 400.

---

## 6. Thành phần giao diện

### 6.1 Nút (Button)

| Loại | Kiểu | Dùng cho |
|------|------|----------|
| Chính (CTA) | Nền cam `#F28C28`, chữ `#12365F` đậm | "Đăng ký tư vấn", "Gửi đăng ký" |
| Phụ | Nền Primary, chữ trắng | Hành động quan trọng khác |
| Viền | Viền Primary 2px, nền trong suốt | "Xem thêm", "Xem học phí" |
| Liên kết chữ | Chữ Primary, gạch chân khi hover | Điều hướng nhẹ |

Kích thước: cao tối thiểu **48px**, padding ngang 24px, chiều rộng 100% trên mobile khi đứng riêng.

### 6.2 Header và menu
- Cao 64px, nền trắng, đổ bóng mức 2 khi cuộn.
- Desktop: logo trái – menu ngang giữa – nút "Đăng ký tư vấn" phải.
- Mobile: logo trái – nút "Đăng ký" nhỏ – biểu tượng menu (☰) mở bảng toàn màn hình.
- Mục menu hiện tại: chữ Primary đậm + gạch chân 3px.
- Mục menu: Trang chủ · Giới thiệu · Thành tích · Chương trình & Học phí · Hoạt động · Liên hệ.

### 6.3 Hero (Trang chủ)
Ảnh nền học sinh/trường, tiêu đề Display màu trắng, mô tả 1–2 dòng, nút CTA cam, form rút gọn. Trên mobile: ảnh phía trên, form xếp dưới trong thẻ trắng.

### 6.4 Form đăng ký

| Trường | Loại | Bắt buộc | Ghi chú |
|--------|------|----------|---------|
| Họ tên phụ huynh | text | Có | |
| Số điện thoại | tel | Có | 10 số, bắt đầu bằng 0; `inputmode="tel"` |
| Email | email | Không | |
| Họ tên học sinh | text | Có | |
| Đăng ký cho | chọn một (chip): Lớp 6 · Lớp 10 · Chuyển trường | Có | Nếu chuyển trường, hiện thêm ô chọn khối |
| Trường đang học | text | Không | |
| Ghi chú / câu hỏi | textarea | Không | |
| Đồng ý xử lý dữ liệu | checkbox | Có | Kèm chú thích mục đích sử dụng |

- Nhãn đặt **phía trên** ô nhập, không dùng placeholder thay nhãn.
- Ô nhập cao 48px, chữ 16px, viền 1px, bo 8px.
- Lỗi hiện ngay dưới ô, chữ đỏ 14px kèm biểu tượng.
- Nút "Gửi đăng ký" rộng 100% trong form.
- Ô ẩn (honeypot) chống spam, không hiển thị với người dùng.

### 6.5 Thẻ (Card)
Dùng cho bài viết, điểm nổi bật, đội ngũ: ảnh tỷ lệ 16:9 (hoặc 1:1 cho chân dung), tiêu đề H3, mô tả tối đa 3 dòng, bo 16px, bóng mức 1, hover nâng lên bóng mức 2.

### 6.6 Khối số liệu (Stat)
Số lớn (Primary, 40–56px) + nhãn nhỏ phía dưới; xếp 2 cột mobile, 4 cột desktop.

### 6.7 Timeline thành tích
Đường dọc màu Primary nhạt, mỗi mốc có năm (đậm), tiêu đề và mô tả ngắn; xếp một cột.

### 6.8 Tab và bảng học phí
- Tab: chuyển giữa các cấp/khối; tab đang chọn nền Primary, chữ trắng. Mobile cuộn ngang được.
- Bảng: tiêu đề nền Primary nhạt, dòng xen kẽ `#F3F7FB`; trên mobile chuyển thành danh sách thẻ.

### 6.9 Nút gọi/Zalo nổi
Chỉ hiện trên mobile, góc dưới bên phải, hai nút tròn 52px (gọi: xanh lá; Zalo: xanh dương), cách mép 16px.

### 6.10 Footer
Nền navy `#12365F`, chữ trắng. Gồm: logo, địa chỉ 170 Quang Trung, Gò Vấp, hotline, email, menu rút gọn, bản quyền.

### 6.11 Thông báo (Toast/Alert)
Thanh ngang có biểu tượng + chữ, dùng màu trạng thái ở mục 2.2; tự ẩn sau 6 giây với thông báo thành công, thông báo lỗi giữ nguyên đến khi người dùng đóng.

---

## 7. Biểu tượng & Hình ảnh

### 7.1 Biểu tượng
- Bộ **Lucide** hoặc **Phosphor** (SVG, nét 1,75px, bo tròn đầu nét), inline SVG để không tải thêm phông.
- Kích thước: 20px trong nút/ô nhập, 24px trong menu, 40–48px trong khối điểm nổi bật.
- Màu theo văn bản; biểu tượng trang trí dùng Secondary xanh lá.
- Biểu tượng đứng một mình (☰, gọi, đóng) phải có `aria-label`.
- Biểu tượng gợi ý: điện thoại, bản đồ, thư, mũ cử nhân, huy chương, lá cây, sách, nhóm người.

### 7.2 Hình ảnh
- **Ảnh thật** của trường (học sinh, lớp học, hoạt động, nông trại). Không dùng ảnh stock có người nước ngoài làm ảnh chính.
- Cần **xin phép** phụ huynh cho ảnh học sinh được đăng công khai.
- Tỷ lệ: hero 16:9 (desktop) và 4:5 (mobile), thẻ 16:9, chân dung 1:1.
- Định dạng WebP (dự phòng JPG), nén ≤ 200KB mỗi ảnh nội dung, hero ≤ 350KB, có `srcset` cho 480/960/1440px.
- Ảnh dưới màn hình đầu tiên dùng `loading="lazy"`; luôn khai báo `width`/`height` để tránh nhảy bố cục.
- Mọi ảnh có `alt` mô tả ngắn bằng tiếng Việt; ảnh trang trí dùng `alt=""`.
- Logo: bản SVG, có bản trắng cho nền tối; vùng an toàn quanh logo bằng chiều cao chữ cái đầu.
- Biểu tượng mạng xã hội (Facebook, YouTube, Zalo) dùng bản đơn sắc.
- Ảnh chia sẻ Open Graph kích thước 1200×630px.

---

## 8. Chuyển động

**Nguyên tắc:** nhẹ, nhanh, có mục đích; không làm chậm việc đăng ký.

| Hiệu ứng | Thời lượng | Easing | Mô tả |
|----------|-----------|--------|-------|
| Hover nút | 150ms | `ease-out` | Đổi màu nền, nâng 1px |
| Hover thẻ | 200ms | `ease-out` | Nâng 4px, bóng mức 2 |
| Mở/đóng menu mobile | 250ms | `ease-in-out` | Trượt từ phải, lớp nền mờ |
| Hiện nội dung khi cuộn | 400ms | `ease-out` | Mờ dần + trượt lên 16px, mỗi khối chỉ chạy một lần |
| Đếm số liệu thành tích | 1200ms | `ease-out` | Đếm từ 0 khi khối vào màn hình, một lần |
| Chuyển tab | 200ms | `ease-in-out` | Nội dung mờ chuyển |
| Hiện lỗi form | 150ms | `ease-out` | Mờ dần + rung nhẹ 4px |
| Nút gửi đang xử lý | lặp | `linear` | Vòng quay nhỏ trong nút |
| Banner hero | 8s mỗi ảnh | `ease-in-out` | Tùy chọn: chuyển mờ giữa 2–3 ảnh, tạm dừng khi người dùng cuộn |

**Quy tắc**
- Tôn trọng `prefers-reduced-motion: reduce`: tắt hiệu ứng cuộn, đếm số và chuyển ảnh tự động; chỉ giữ đổi màu tức thì.
- Chỉ animate `transform` và `opacity` để giữ hiệu năng.
- Không dùng hiệu ứng tự phát âm thanh/video có tiếng.

---

## 9. Trạng thái giao diện

### 9.1 Thành phần tương tác

| Trạng thái | Nút CTA | Ô nhập | Liên kết/Menu |
|-----------|---------|--------|---------------|
| Mặc định | Cam `#F28C28` | Viền `#D9E2EC` | Chữ `#1F2933` |
| Hover | Cam đậm `#D9730D` | Viền `#9FB3C8` | Chữ Primary, gạch chân |
| Focus (bàn phím) | Viền ngoài 3px `#1B4F8F`, cách 2px | Viền Primary 2px + vòng sáng | Viền ngoài 3px |
| Nhấn (active) | Cam đậm hơn, dịch xuống 1px | – | – |
| Vô hiệu | Xám `#D9E2EC`, chữ `#7B8794`, con trỏ `not-allowed` | Nền `#F3F7FB` | – |
| Lỗi | – | Viền đỏ `#C62828`, nền `#FDECEA`, thông báo bên dưới | – |
| Hợp lệ | – | Viền xanh `#1E8E4E`, dấu ✓ (tùy chọn) | – |

### 9.2 Trạng thái form đăng ký

| Trạng thái | Hiển thị |
|-----------|----------|
| Ban đầu | Form trống, nút "Gửi đăng ký" bật |
| Đang điền | Kiểm tra từng ô khi rời ô (blur), không báo lỗi khi mới bắt đầu gõ |
| Có lỗi | Cuộn tới ô lỗi đầu tiên, focus vào ô đó; thông báo cụ thể (ví dụ "Số điện thoại cần 10 chữ số, bắt đầu bằng 0") |
| Đang gửi | Nút vô hiệu, hiện vòng quay và chữ "Đang gửi…"; khóa form |
| Thành công | Thay form bằng khối xác nhận (biểu tượng ✓ xanh, "Cảm ơn quý phụ huynh!", nội dung liên hệ lại trong 24 giờ làm việc, nút "Về trang chủ", số hotline) |
| Thất bại | Thông báo đỏ phía trên form: "Chưa gửi được. Vui lòng thử lại hoặc gọi hotline …"; **giữ nguyên dữ liệu** đã điền |

### 9.3 Trạng thái nội dung

| Trạng thái | Hiển thị |
|-----------|----------|
| Đang tải | Khung xương (skeleton) xám nhạt cho thẻ và ảnh, không dùng vòng quay toàn trang |
| Rỗng | Hộp minh họa + dòng "Nội dung đang được cập nhật" + liên kết về trang chủ (dùng cho Tin tức khi chưa có bài) |
| Ảnh lỗi | Nền xám `#F3F7FB` kèm biểu tượng ảnh, giữ nguyên tỷ lệ |
| Mất mạng | Thanh cảnh báo cam phía trên: "Không có kết nối mạng" |
| Trang không tồn tại (404) | Thông điệp thân thiện + nút "Về trang chủ" + nút "Đăng ký tư vấn" |
| Bản đồ không tải được | Hiện địa chỉ dạng chữ và nút "Mở trong Google Maps" |

### 9.4 Trạng thái điều hướng
- **Mục menu đang xem:** chữ Primary đậm, gạch chân 3px, `aria-current="page"`.
- **Header khi cuộn:** thêm bóng mức 2; trên mobile ẩn khi cuộn xuống, hiện lại khi cuộn lên (tùy chọn).
- **Menu mobile mở:** khóa cuộn nền, focus vào nút đóng, đóng bằng phím Esc hoặc bấm ra ngoài.

---

## 10. Bổ sung: màn hình và chức năng PRD chưa có mô tả giao diện

> Phần này được thêm sau khi đối chiếu PRD.md với các mục 1–9 ở trên. Mọi màu, phông, bo góc, đổ bóng, khoảng cách đều lấy từ mục 2–5; không đặt giá trị mới. Điểm ngắt: điện thoại 360–767px, máy tính bảng 768–1023px, máy tính ≥ 1024px.

### 10.0 Kết quả đối chiếu

| PRD | Chức năng / màn hình | DESIGN trước đây | Bổ sung tại |
|-----|----------------------|------------------|-------------|
| F-09 | Trang Liên hệ | Chỉ 1 dòng bố cục | 10.1 |
| F-06 | Trang Giới thiệu trường | Chỉ 1 dòng bố cục | 10.2 |
| F-13 | Trang Hoạt động & Tin tức (danh sách + bài chi tiết) | Chỉ có thẻ và 1 dòng bố cục | 10.3 |
| F-16 | Thư viện ảnh/video, lightbox | Chỉ có z-index | 10.4 |
| F-17 | Cảm nhận phụ huynh | Chưa có | 10.5 |
| F-18 | Đặt lịch tham quan | Chưa có | 10.6 |
| F-19 | Chuyển đổi tiếng Anh | Chưa có | 10.7 |
| F-05 | Trang xác nhận đăng ký | Chỉ có trạng thái trong form (9.2) | 10.8 |
| F-01 | Form rút gọn, dải điểm nổi bật và khối CTA cuối trang | Chỉ nhắc ngắn | 10.9 |
| F-07, F-08 | Huy hiệu chứng nhận, thẻ chương trình, chính sách | Chỉ nhắc tên | 10.10 |
| F-04, US-08 | Google Sheet và email thông báo cho nhân viên | Chưa có | 10.11 |

Đã có đủ mô tả, không bổ sung: Trang chủ (hero), Thành tích (số liệu, timeline), Chương trình & học phí (tab, bảng), Đăng ký tư vấn (form và trạng thái), menu, footer, nút gọi/Zalo nổi, thông báo, trang 404. F-14 (SEO) và F-15 (Analytics) không có giao diện.

---

### 10.1 Trang Liên hệ (F-09)

**(1) Bố cục tổng thể**

```
Desktop                                   Điện thoại
┌──────────────────────────────┐          ┌───────────────┐
│ H1: Liên hệ                  │          │ H1: Liên hệ   │
├───────────────┬──────────────┤          ├───────────────┤
│ Thẻ thông tin │ Bản đồ       │          │ Thẻ thông tin │
│ - Địa chỉ     │ (Google Maps)│          │ [Gọi hotline] │
│ - Hotline     │ cao 400px    │          │ [Chỉ đường]   │
│ - Email       │              │          │ [Nhắn Zalo]   │
│ - Giờ làm việc│              │          ├───────────────┤
│ [Gọi][Zalo]   │              │          │ Bản đồ 280px  │
├───────────────┴──────────────┤          ├───────────────┤
│ Các cơ sở (nếu có nhiều)     │          │ Các cơ sở     │
├──────────────────────────────┤          └───────────────┘
│ Khối CTA đăng ký tư vấn      │
└──────────────────────────────┘
```

Cột trái : cột phải = 5 : 7 (12 cột). Khoảng giữa hai cột 24px.

**(2) Thành phần**
- **Thẻ thông tin:** nền `#F3F7FB`, viền 1px `#D9E2EC`, bo 16px, padding 24px (mobile 16px). Mỗi dòng gồm biểu tượng 24px màu Secondary + nhãn (chữ nhỏ 14px, chữ phụ `#52606D`) + giá trị (Body lớn 18px, đậm 600, chữ `#1F2933`).
- **Các dòng:** Địa chỉ (170 Quang Trung, Gò Vấp); Hotline (liên kết `tel:`); Email (liên kết `mailto:`); Giờ làm việc (bảng 2 cột nhỏ: Thứ 2–6, Thứ 7).
- **Nút:** "Gọi hotline" (CTA cam, vì là hành động chính của trang), "Chỉ đường" (viền Primary, mở Google Maps), "Nhắn Zalo" (phụ, nền Primary). Chỉ một nút cam trong màn hình đầu tiên.
- **Bản đồ nhúng:** iframe Google Maps, bo 16px, bóng mức 1, `loading="lazy"`, `title` mô tả.
- **Thẻ cơ sở** (hiện khi nhà trường xác nhận có nhiều cơ sở): thẻ theo 6.5, gồm tên cơ sở, địa chỉ, nút "Xem bản đồ". Chọn thẻ thì bản đồ đổi vị trí.
- **Mạng xã hội:** biểu tượng đơn sắc Facebook, YouTube, Zalo (7.2), mỗi nút 44×44px.
- **Khối CTA cuối trang:** theo 10.9.

**(3) Màu và chữ:** H1 theo cấp H1 (Be Vietnam Pro 700, màu navy `#12365F`); nền trang trắng; không dùng màu mới. Khi bản đồ lỗi dùng trạng thái 9.3 ("Mở trong Google Maps").

**(4) Điện thoại**
- Xếp một cột theo thứ tự: thông tin → 3 nút (xếp dọc, rộng 100%, cao 48px) → bản đồ cao 280px → các cơ sở.
- Số điện thoại và email là liên kết chạm được, vùng chạm tối thiểu 48px.
- Ẩn nút gọi/Zalo nổi (6.9) trên trang này để không trùng với các nút ngay trong trang.
- Các thẻ cơ sở xếp 1 cột, cuộn dọc.

---

### 10.2 Trang Giới thiệu trường (F-06)

**(1) Bố cục tổng thể**

```
┌──────────────────────────────────┐
│ Ảnh bìa (H1 đè lên, lớp phủ xanh)│
├──────────────────────────────────┤
│ Đoạn mở đầu (1–2 đoạn, Body lớn) │
├──────────────────────────────────┤
│ Sứ mệnh | Tầm nhìn | Giá trị     │  3 thẻ
├──────────────────────────────────┤
│ Hành trình (timeline)            │  nền #F3F7FB
├──────────────────────────────────┤
│ Thông điệp từ Hiệu trưởng        │  ảnh + trích dẫn
├──────────────────────────────────┤
│ Đội ngũ giáo viên (lưới thẻ)     │
├──────────────────────────────────┤
│ Cơ sở vật chất & Nông trại       │  lưới ảnh
├──────────────────────────────────┤
│ Khối CTA                         │
└──────────────────────────────────┘
```

**(2) Thành phần**
- **Ảnh bìa:** tỷ lệ 21:9 desktop, 4:3 mobile, lớp phủ gradient như mục 5.3, H1 trắng cấp Display.
- **Thẻ Sứ mệnh / Tầm nhìn / Giá trị:** thẻ theo 6.5 không ảnh; biểu tượng 40px Secondary, H3, 2–3 dòng mô tả.
- **Hành trình:** dùng lại Timeline (6.7), các mốc do nhà trường cung cấp.
- **Thông điệp Hiệu trưởng:** ảnh chân dung 1:1 bo tròn (180px) + khối trích dẫn: nền `#F3F7FB`, vạch trái 4px Secondary, chữ 18px, dưới cùng là tên và chức danh (chữ nhỏ, đậm 600).
- **Thẻ giáo viên:** ảnh 1:1, tên (H3), chức danh/môn (chữ nhỏ, chữ phụ); không thêm thông tin cá nhân.
- **Lưới ảnh cơ sở vật chất & nông trại:** ảnh bo 16px, có chú thích ngắn phía dưới; bấm ảnh mở lightbox (10.4).
- **Nhãn "Chứng nhận" cạnh nông trại:** huy hiệu tròn nền `#E6F5EC`, chữ `#1E8E4E` (vd. VietGAP) khi nhà trường xác nhận.

**(3) Màu và chữ:** nền các khối xen kẽ trắng / `#F3F7FB`; tiêu đề khối H2 màu navy; đoạn mở đầu Body lớn 18px, dòng cao 1.6, độ dài dòng 55–75 ký tự.

**(4) Điện thoại**
- Ảnh bìa 4:3, H1 cỡ 28px; ba thẻ sứ mệnh xếp dọc 1 cột.
- Thông điệp Hiệu trưởng: ảnh phía trên (140px, căn giữa), trích dẫn bên dưới, rộng 100%.
- Đội ngũ: dãy thẻ cuộn ngang có điểm dừng (snap), mỗi thẻ rộng 70% màn hình, có gợi ý thẻ kế tiếp lấp ló.
- Lưới ảnh 2 cột (máy tính bảng 3 cột, máy tính 4 cột).

---

### 10.3 Trang Hoạt động & Tin tức (F-13)

#### 10.3.1 Danh sách

**(1) Bố cục tổng thể**

```
┌──────────────────────────────────┐
│ H1: Hoạt động & Tin tức          │
│ Chip lọc: Tất cả|Sự kiện|Ngoại   │
│           khóa|Tuyển sinh        │
├──────────────────────────────────┤
│ Thẻ nổi bật (ảnh lớn + tiêu đề)  │
├──────────────────────────────────┤
│ Lưới thẻ bài viết (3 cột)        │
│ [Xem thêm]                       │
├──────────────────────────────────┤
│ Thư viện ảnh & video (10.4)      │
├──────────────────────────────────┤
│ Khối CTA                         │
└──────────────────────────────────┘
```

**(2) Thành phần**
- **Chip lọc:** hình viên thuốc (bo 999px), cao 40px, chữ nút 16px/500; mặc định viền `#D9E2EC` chữ `#1F2933`; đang chọn nền Primary, chữ trắng.
- **Thẻ nổi bật:** ảnh 16:9, đè tiêu đề H2 trắng trên lớp phủ xanh (5.3); chiếm 2/3 chiều rộng, bên cạnh 2 thẻ nhỏ (desktop).
- **Thẻ bài viết:** theo 6.5 và thêm hàng "nhãn danh mục + ngày" (chữ 14px; nhãn nền `#E8F1FB`, chữ Primary, bo 999px; ngày màu `#52606D`).
- **Nút "Xem thêm":** kiểu Viền, tải thêm 6 bài mỗi lần (không phân trang vì dữ liệu là JSON tĩnh).
- **Trạng thái:** đang tải = skeleton; chưa có bài = trạng thái "Rỗng" ở 9.3.

**(3) Màu và chữ:** tiêu đề thẻ H3 (20px/600, màu `#1F2933`, hover đổi Primary); mô tả tối đa 3 dòng, 16px, `#52606D`.

**(4) Điện thoại**
- Chip lọc xếp một hàng, cuộn ngang, không xuống dòng.
- Thẻ nổi bật chuyển thành thẻ thường (ảnh trên, chữ dưới) như các thẻ khác; lưới 1 cột (máy tính bảng 2 cột).
- Nút "Xem thêm" rộng 100%.

#### 10.3.2 Bài viết chi tiết (`/hoat-dong/<tên-bài>.html`)

**(1) Bố cục tổng thể**

```
┌──────────────────────────────────┐
│ Breadcrumb: Hoạt động > Tên bài  │
│ H1 (tiêu đề bài)                 │
│ Nhãn danh mục · Ngày đăng        │
│ Ảnh bìa 16:9                     │
├──────────────────────────────────┤
│ Nội dung bài (rộng tối đa 720px) │
│ Thanh chia sẻ                    │
├──────────────────────────────────┤
│ Bài liên quan (3 thẻ)            │
├──────────────────────────────────┤
│ Khối CTA                         │
└──────────────────────────────────┘
```

**(2) Thành phần:** breadcrumb (chữ nhỏ, liên kết Primary); khối nội dung bài (Body lớn 18px, dòng cao 1.7; H2 trong bài 24px; ảnh trong bài bo 16px có chú thích 14px); thanh chia sẻ (3 nút tròn 44px: Zalo, Facebook, Sao chép liên kết; sao chép xong hiện toast "Đã sao chép liên kết"); 3 thẻ bài liên quan theo 6.5; nút "← Về danh sách" (liên kết chữ).

**(3) Màu và chữ:** như 10.3.1; trích dẫn trong bài dùng kiểu khối trích dẫn ở 10.2.

**(4) Điện thoại:** nội dung rộng 100% (lề 16px); thanh chia sẻ xếp ngang dưới bài; bài liên quan xếp 1 cột; breadcrumb chỉ hiện "← Hoạt động" để gọn.

---

### 10.4 Thư viện ảnh/video và lightbox (F-16)

**(1) Bố cục tổng thể:** nằm cuối trang Hoạt động & Tin tức (và dùng lại ở lưới ảnh trang Giới thiệu). Hàng đầu là 1 video YouTube giới thiệu trường (16:9), bên dưới là lưới ảnh. Bấm ảnh mở lightbox phủ toàn màn hình.

```
Lightbox (z-index 400)
┌─────────────────────────────────┐
│                          [ ✕ ]  │
│  [‹]       Ảnh lớn        [›]   │
│        Chú thích · 3 / 12       │
└─────────────────────────────────┘
```

**(2) Thành phần**
- **Video:** hiển thị ảnh đại diện + nút Play tròn 64px (nền cam `#F28C28`, biểu tượng `#12365F`); chỉ nạp iframe YouTube khi bấm để nhẹ trang. Đây là nút cam duy nhất của khối.
- **Lưới ảnh:** ô vuông 1:1, bo 16px, hover phóng nhẹ 1.03 và phủ biểu tượng phóng to.
- **Lightbox:** nền navy `rgba(18,54,95,.92)`; ảnh `object-fit: contain`; nút đóng ✕ (48×48px, trên phải); mũi tên ‹ › (48×48px, nền trắng 90%); bộ đếm "3 / 12" và chú thích (chữ trắng 14px) ở dưới.
- **Điều khiển:** phím `Esc` đóng, `←` `→` chuyển ảnh, giữ focus trong lightbox, `aria-modal="true"`.

**(3) Màu và chữ:** chữ trắng trên nền navy, đạt tương phản AA; chuyển ảnh mờ dần 200ms (8. Chuyển động); tắt hiệu ứng khi `prefers-reduced-motion`.

**(4) Điện thoại**
- Lưới 2 cột (máy tính bảng 3, máy tính 4).
- Lightbox full màn hình, vuốt trái/phải để chuyển ảnh, vuốt xuống để đóng; ẩn mũi tên, giữ nút ✕ ở góc trên phải.
- Video rộng 100% màn hình, tỷ lệ 16:9.

---

### 10.5 Cảm nhận phụ huynh (F-17)

**(1) Bố cục tổng thể:** khối riêng, đặt cuối trang Thành tích ngay trên khối CTA. Nền `#F3F7FB`, tiêu đề H2 "Phụ huynh nói gì về Hồng Hà", các thẻ cảm nhận bên dưới.

**(2) Thành phần**
- **Thẻ cảm nhận:** nền trắng, bo 16px, bóng mức 1, padding 24px. Gồm: dấu trích 32px màu Secondary, nội dung (Body 16px, tối đa 5 dòng, chữ `#1F2933`), avatar tròn 56px, tên (đậm 600), mô tả (14px, `#52606D`, vd. "Phụ huynh em …, lớp …").
- **Điều khiển:** hai nút ‹ › (desktop) và chấm chỉ vị trí (tối đa 6 chấm, đang chọn màu Primary).
- Chỉ hiện khi có chữ ký đồng ý của phụ huynh (xem 7.2); không có ảnh thì dùng avatar chữ cái đầu nền `#E8F1FB`, chữ Primary.

**(3) Màu và chữ:** nền khối `#F3F7FB`, thẻ trắng; không dùng màu cam.

**(4) Điện thoại:** mỗi lần thấy 1 thẻ (rộng 88% màn hình), vuốt ngang có điểm dừng; hiện chấm bên dưới, ẩn nút ‹ ›. Desktop hiện 3 thẻ cùng lúc.

---

### 10.6 Đặt lịch tham quan trường (F-18)

**(1) Bố cục tổng thể:** mở rộng ngay trong form Đăng ký tư vấn (6.4), không tạo trang mới. Cuối form, trước ô đồng ý, có công tắc "Tôi muốn đặt lịch tham quan trường". Bật công tắc thì khối lịch trượt mở ra bên dưới.

```
[ ⬜ Tôi muốn đặt lịch tham quan trường ]
┌ Khối lịch (nền #F3F7FB, bo 16px) ──────┐
│ Ngày tham quan   [ dd/mm/yyyy      ]   │
│ Khung giờ        (8:00)(9:30)(14:00)(15:30) │
│ Số người đi cùng [ – ]  2  [ + ]       │
│ Cơ sở (nếu có nhiều)  [ chọn ▾ ]       │
└────────────────────────────────────────┘
```

**(2) Thành phần**
- **Công tắc (switch):** rộng 48px, cao 28px; tắt = nền `#D9E2EC`, bật = nền Secondary `#2E8B57`.
- **Chọn ngày:** ô nhập cao 48px (như 6.4); chỉ cho chọn từ ngày mai, Thứ 2–Thứ 7; ngày không hợp lệ báo lỗi dưới ô.
- **Khung giờ:** nhóm chip (cùng kiểu chip 10.3.1), chọn một.
- **Số người:** bộ tăng giảm (stepper) với 2 nút tròn 48px và số ở giữa, từ 1 đến 5.
- **Cơ sở:** hộp chọn, chỉ hiện nếu nhà trường xác nhận nhiều cơ sở.
- **Xác nhận lịch:** khối tóm tắt trong trang xác nhận (10.8), ví dụ "Thứ Bảy, 08/11/2026 · 9:30 · 2 người".
- **Ghi chú nhỏ dưới khối:** "Nhà trường sẽ gọi xác nhận lại lịch." (14px, `#52606D`). Phiên bản này không kiểm tra lịch đã đầy nên không có chip bị khóa.

**(3) Màu và chữ:** khối nền `#F3F7FB`, viền `#D9E2EC`; nhãn 16px/500; trạng thái lỗi/focus theo 9.1.

**(4) Điện thoại:** dùng bộ chọn ngày gốc của hệ điều hành (`type="date"`); chip giờ xếp lưới 2 cột; stepper nút 48px; công tắc và nhãn nằm trên cùng một hàng, bấm cả hàng để bật/tắt.

---

### 10.7 Chuyển đổi tiếng Anh (F-19)

**(1) Bố cục tổng thể:** bộ chuyển ngôn ngữ nằm ở header, bên phải menu và bên trái nút "Đăng ký tư vấn". Các trang tiếng Anh dùng lại nguyên bố cục của trang tiếng Việt, đặt trong thư mục `/en/`.

**(2) Thành phần**
- **Bộ chuyển ngôn ngữ (segmented control):** hai nút "VI | EN", cao 36px, bo 999px, viền 1px `#D9E2EC`. Ngôn ngữ đang dùng nền Primary, chữ trắng; còn lại chữ `#1F2933`.
- Mỗi nút có `lang` và `aria-label` ("Tiếng Việt", "English"); trang có thẻ `hreflang` cho SEO.
- Khi chuyển ngôn ngữ, giữ nguyên trang đang xem (vd. `/thanh-tich.html` ↔ `/en/achievements.html`).
- Nhớ lựa chọn vào đường dẫn, không cần lưu trong trình duyệt.

**(3) Màu và chữ:** vẫn dùng Be Vietnam Pro (có đủ chữ Latin); văn bản tiếng Anh thường dài hơn, nên nút và tiêu đề cần co giãn theo nội dung (không đặt chiều rộng cố định cho nút) và kiểm tra tiêu đề không vỡ dòng xấu.

**(4) Điện thoại:** bộ chuyển ngôn ngữ ẩn khỏi thanh header, chuyển vào đầu bảng menu toàn màn hình (rộng 100%, cao 48px, hai nửa bằng nhau); giữ vùng chạm ≥ 44px.

---

### 10.8 Trang xác nhận đăng ký (F-05)

**(1) Bố cục tổng thể:** hiện sau khi gửi thành công (thay form tại chỗ hoặc chuyển sang `/cam-on.html`). Header và footer giữ nguyên; **không** hiện khối CTA đăng ký ở cuối trang.

```
┌──────────────────────────────┐
│          ( ✓ )               │  vòng tròn 64px
│   Cảm ơn quý phụ huynh!      │  H1
│   Nhà trường đã nhận thông   │
│   tin và sẽ liên hệ trong    │
│   24 giờ làm việc.           │
│ ┌ Thông tin đã gửi ────────┐ │
│ │ Phụ huynh: Nguyễn A      │ │
│ │ SĐT: 090****727          │ │
│ │ Đăng ký cho: Lớp 6       │ │
│ │ Lịch tham quan: …(nếu có)│ │
│ └──────────────────────────┘ │
│ Các bước tiếp theo           │
│  1 Nhận thông tin → 2 Gọi lại│
│  → 3 Tư vấn / tham quan      │
│ [Xem chương trình & học phí] │
│ [Về trang chủ] [Gọi hotline] │
└──────────────────────────────┘
```

**(2) Thành phần**
- **Biểu tượng thành công:** vòng tròn 64px nền `#E6F5EC`, dấu ✓ màu `#1E8E4E`.
- **Tiêu đề & mô tả:** H1 màu navy, Body lớn 18px, căn giữa.
- **Thẻ tóm tắt:** nền `#F3F7FB`, bo 16px, hai cột nhãn/giá trị; số điện thoại che giữa để bảo mật.
- **Các bước tiếp theo:** 3 bước đánh số, vòng tròn số nền Primary chữ trắng, nối nhau bằng đường kẻ `#D9E2EC`.
- **Nút:** "Xem chương trình & học phí" (CTA cam, duy nhất), "Về trang chủ" (viền), "Gọi hotline" (liên kết chữ).
- Nội dung và chuyển trạng thái theo 9.2 (Thành công).

**(3) Màu và chữ:** khung tối đa 560px, căn giữa, thẻ trắng bóng mức 3 (nổi trên nền `#F3F7FB`).

**(4) Điện thoại:** thẻ rộng 100% (lề 16px), ba nút xếp dọc rộng 100%; các bước xếp dọc với đường nối thẳng đứng; sau khi gửi tự cuộn lên đầu và đặt focus vào H1, thông báo cho trình đọc màn hình bằng `aria-live="polite"`.

---

### 10.9 Trang chủ: form rút gọn, dải điểm nổi bật, khối CTA cuối trang (F-01)

**(1) Bố cục tổng thể**

```
Desktop                                   Điện thoại
┌──────────────┬──────────────┐           ┌───────────────┐
│ Hero: Display│ Thẻ form     │           │ Ảnh hero 4:5  │
│ + mô tả      │ rút gọn      │           │ Display + mô tả│
│ + [CTA]      │ (400px)      │           ├───────────────┤
├──────────────┴──────────────┤           │ Thẻ form rút gọn│
│ Dải 4 điểm nổi bật          │           ├───────────────┤
├─────────────────────────────┤           │ Điểm nổi bật  │
│ Khối CTA cuối trang         │           │ (2×2)         │
└─────────────────────────────┘           │ Khối CTA      │
                                          └───────────────┘
```

**(2) Thành phần**
- **Form rút gọn:** thẻ trắng, bo 16px, bóng mức 3, padding 24px. Gồm tiêu đề H3 "Nhận tư vấn miễn phí", ô "Họ tên", ô "Số điện thoại" (cao 48px, theo 6.4), dòng đồng ý (checkbox + chữ 14px), nút "Gửi đăng ký" (CTA cam, rộng 100%). Liên kết chữ "Điền thông tin đầy đủ →" dẫn tới trang Đăng ký tư vấn.
- **Sau khi gửi:** thay form bằng thông báo thành công gọn (✓ xanh + "Đã nhận! Chúng tôi sẽ gọi lại sớm") kèm liên kết "Bổ sung thông tin cho con" tới form đầy đủ; trạng thái đang gửi/lỗi theo 9.2.
- **Dải điểm nổi bật (3–4 mục):** mỗi mục có biểu tượng 40–48px màu Secondary, 1 dòng tiêu đề (H3), và liên kết chữ "Xem thêm" dẫn đến trang riêng (Thành tích, Chương trình, Hoạt động…). Không viết đoạn dài.
- **Khối CTA cuối trang (dùng lại ở mọi trang trừ Đăng ký, Xác nhận):** nền gradient Primary `#1B4F8F` → navy `#12365F`, bo 24px (desktop), H2 trắng "Đăng ký tư vấn miễn phí", mô tả 1 dòng, nút cam "Đăng ký tư vấn", dòng nhỏ "Hoặc gọi hotline 0902 793 727" (số cần xác nhận, xem phụ lục PRD).

**(3) Màu và chữ:** tiêu đề hero theo cấp Display màu trắng trên lớp phủ 5.3; chữ trên nền Primary đạt AA; nút cam dùng chữ `#12365F` đậm.

**(4) Điện thoại:** form rút gọn nằm dưới ảnh hero trong thẻ trắng, rộng 100%; dải điểm nổi bật xếp lưới 2×2; khối CTA căn giữa, nút rộng 100%, góc bo 16px; nút gọi/Zalo nổi không che nút "Gửi đăng ký" (chừa khoảng đệm dưới 80px).

---

### 10.10 Thành tích và Chương trình: các thành phần còn thiếu (F-07, F-08)

**(1) Bố cục tổng thể**
- **Thành tích:** thêm vào sau Timeline một khối "Chứng nhận & Công nhận" (lưới huy hiệu), trước khối Cảm nhận phụ huynh (10.5).
- **Chương trình & học phí:** thứ tự là Tab → danh sách thẻ chương trình → bảng học phí → khối chính sách → CTA.

**(2) Thành phần**
- **Huy hiệu chứng nhận:** ô trắng 1:1, bo 16px, viền `#D9E2EC`, bóng mức 1; logo/biểu tượng chứng nhận ở giữa (ISO, VietGAP…), tên dưới (14px, đậm 600). Bấm mở ảnh giấy chứng nhận trong lightbox (10.4).
- **Thẻ chương trình** (tiếng Anh/IELTS, du học, ngoại khóa): thẻ theo 6.5, có biểu tượng 40px Secondary, H3, 3 gạch đầu dòng ngắn, nút viền "Tìm hiểu thêm". Có thể có nhãn "Mới" (nền `#FFF4E0`, chữ `#B26A00`).
- **Khối chính sách & học bổng:** hộp thông tin nền `#E8F1FB`, vạch trái 4px Primary, bo 8px, biểu tượng ⓘ; bên dưới là danh sách thu gọn (accordion): hàng cao tối thiểu 56px, tiêu đề 16px/600, mũi tên xoay 180° khi mở (200ms).
- **Ghi chú học phí:** dòng nhỏ 14px `#52606D` dưới bảng ("Học phí có thể thay đổi, vui lòng liên hệ để được tư vấn"). Nếu nhà trường không công khai học phí, thay bảng bằng hộp thông tin kèm nút CTA cam "Nhận bảng học phí".

**(3) Màu và chữ:** chỉ dùng màu đã có ở 2.1 và 2.2; số liệu học phí chữ đậm 600, căn phải trong bảng.

**(4) Điện thoại:** huy hiệu xếp 2 cột; thẻ chương trình 1 cột và gọn thành accordion (mở từng thẻ); bảng học phí đổi sang danh sách thẻ (đã có ở 6.8); khối chính sách rộng 100%.

---

### 10.11 Giao diện nội bộ: Google Sheet và email thông báo (F-04, US-08)

Nhân viên tuyển sinh chỉ dùng hai giao diện này, nên cũng cần được thiết kế (không phải trang web công khai).

**(1) Bố cục tổng thể**
- **Google Sheet "Đăng ký tư vấn":** mỗi đăng ký là một dòng, mới nhất ở trên cùng. Cố định hàng tiêu đề và 3 cột đầu (Thời gian, Họ tên PH, SĐT).
- **Email thông báo:** một cột rộng 600px, căn giữa.

```
Email
┌ Header nền #1B4F8F: "Đăng ký tư vấn mới" ┐
│ Bảng thông tin (nhãn | giá trị)           │
│ [ Gọi 090xxxxxxx ]  [ Mở Google Sheet ]   │
│ Footer: gửi tự động từ website            │
└───────────────────────────────────────────┘
```

**(2) Thành phần**
- **Cột trong Sheet:** Thời gian · Họ tên phụ huynh · SĐT · Email · Họ tên học sinh · Đăng ký cho · Khối (nếu chuyển trường) · Trường hiện tại · Ghi chú · Lịch tham quan (nếu có) · Nguồn (utm) · Trạng thái · Ngày gọi · Người phụ trách · Ghi chú sau cuộc gọi. Ba cột cuối do nhân viên điền.
- **Cột "Trạng thái" (danh sách chọn)** tô màu theo bảng 2.2: Mới (nền `#FFF4E0`), Đã gọi (`#E8F1FB`), Đã hẹn tham quan / Đã tư vấn (`#E6F5EC`), Không liên lạc được (`#FDECEA`).
- **Hàng tiêu đề Sheet:** nền Primary `#1B4F8F`, chữ trắng đậm; dòng xen kẽ `#F3F7FB`.
- **Email:** tiêu đề thư "[Tuyển sinh] Đăng ký mới – {Họ tên} – {Lớp 6}"; bảng thông tin nền `#F3F7FB`; nút "Gọi {SĐT}" (cam `#F28C28`, chữ `#12365F`, liên kết `tel:`) và "Mở Google Sheet" (viền Primary).

**(3) Màu và chữ:** dùng đúng bảng màu 2.1–2.2. Email dùng phông hệ thống (`Arial`, `Segoe UI`, `sans-serif`) vì phần lớn ứng dụng thư không tải được phông web; cỡ chữ ≥ 16px.

**(4) Điện thoại**
- Email co giãn theo màn hình (tối đa 600px), nút xếp dọc rộng 100%, cao 48px; số điện thoại chạm là gọi được.
- Sheet trên ứng dụng Google Sheets: cố định 3 cột đầu, bật xem dạng thẻ (Card view) để đọc từng đăng ký; cột "Trạng thái" vẫn đổi được bằng danh sách chọn.
