# DESIGN – Ứng dụng Ghi chép Thu/Chi Hằng ngày

> Phiên bản: 1.0 · Ngày: 2026-10-27 · Liên kết yêu cầu: [PRD.md](PRD.md)

---

## 1. Tổng quan

**Tên tạm:** Sổ Thu Chi

**Tinh thần thiết kế:** Sạch, nhẹ, đáng tin. Giống một cuốn sổ tay hiện đại: ít chi tiết thừa, con số là nhân vật chính, màu sắc chỉ dùng để truyền nghĩa (thu / chi / cảnh báo).

**Nguyên tắc**
1. **Nhập nhanh trước tiên** – mọi thứ phục vụ việc ghi một khoản trong vài giây.
2. **Số liệu là trung tâm** – số tiền lớn, rõ, căn phải, dùng số đều nét (tabular).
3. **Màu có ý nghĩa** – xanh lá = thu, đỏ cam = chi; không dùng hai màu này cho mục đích khác.
4. **Mobile-first** – thiết kế cho ngón cái trước, mở rộng lên laptop sau.
5. **Không chỉ dựa vào màu** – luôn kèm dấu (+/−), biểu tượng hoặc nhãn chữ.

**Hai màn hình:** Trang chủ (tổng quan + danh sách) và Trang Nhập liệu (thêm/sửa).

---

## 2. Màu sắc

Định nghĩa dưới dạng biến CSS ở `:root`, ghi đè trong chế độ tối.

### 2.1 Màu thương hiệu & ngữ nghĩa

| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `--primary` | `#2F6FED` | `#6C9BFF` | Nút chính, liên kết, trạng thái chọn, focus |
| `--primary-contrast` | `#FFFFFF` | `#0B1220` | Chữ trên nền primary |
| `--income` | `#12805C` | `#3DD598` | Khoản thu, tổng thu, số dương |
| `--income-soft` | `#E3F5EE` | `#12372C` | Nền nhẹ cho thẻ/chip thu |
| `--expense` | `#C8421E` | `#FF8A65` | Khoản chi, tổng chi |
| `--expense-soft` | `#FCEBE5` | `#3F2219` | Nền nhẹ cho thẻ/chip chi |
| `--danger` | `#B3261E` | `#F2766D` | Xóa, lỗi |
| `--warning` | `#8A6100` | `#F2C14E` | Cảnh báo (vd. storage gần đầy) |

### 2.2 Màu nền & chữ

| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `--bg` | `#F6F7F9` | `#0F1115` | Nền trang |
| `--surface` | `#FFFFFF` | `#181B21` | Thẻ, modal, thanh điều hướng |
| `--surface-2` | `#EEF0F4` | `#222630` | Ô nhập, chip chưa chọn, thanh tiến trình |
| `--border` | `#DDE1E8` | `#2E3340` | Đường viền, đường kẻ |
| `--text` | `#14181F` | `#ECEFF4` | Chữ chính |
| `--text-muted` | `#5B6472` | `#A0A8B6` | Chữ phụ, nhãn, ghi chú |

Số dư dương dùng `--text`/`--primary`, âm dùng `--expense`.

### 2.3 Màu biểu đồ (theo danh mục chi)

Tám màu phân biệt được ở cả nền sáng và tối, đặt ở token `--cat-1…8`:

| Danh mục | Sáng | Tối |
|---|---|---|
| Ăn uống | `#E8743B` | `#FF9A66` |
| Di chuyển | `#2F6FED` | `#6C9BFF` |
| Nhà ở | `#7A5AF8` | `#A58BFF` |
| Mua sắm | `#D9468F` | `#F07DB5` |
| Giải trí | `#E0A100` | `#F2C14E` |
| Sức khỏe | `#12805C` | `#3DD598` |
| Học tập | `#0E9AA7` | `#4FD1DB` |
| Khác | `#7B8494` | `#9AA3B2` |

Biểu đồ cột: Thu = `--income`, Chi = `--expense`.

**Quy tắc tương phản:** chữ thường ≥ 4.5:1, chữ lớn và thành phần giao diện ≥ 3:1 (WCAG 2.1 AA). Chế độ tối theo `prefers-color-scheme`, cho phép bật/tắt thủ công (Should).

---

## 3. Chữ viết

**Họ chữ:** `Inter` (hỗ trợ tiếng Việt đầy đủ), dự phòng: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

**Số tiền:** bật `font-variant-numeric: tabular-nums` để các chữ số thẳng hàng.

| Cấp | Cỡ / Dòng | Độ đậm | Dùng cho |
|---|---|---|---|
| Display | 32 / 40 px | 700 | Ô nhập số tiền, số dư ở thẻ chính |
| H1 | 24 / 32 px | 700 | Tiêu đề màn hình |
| H2 | 18 / 26 px | 600 | Tiêu đề khu vực (Biểu đồ, Giao dịch) |
| Body | 16 / 24 px | 400 | Nội dung, ghi chú |
| Body-strong | 16 / 24 px | 600 | Số tiền ở danh sách, nhãn chính |
| Caption | 13 / 18 px | 500 | Nhãn thẻ, ngày, chú giải |
| Overline | 12 / 16 px | 600 | Tiêu đề nhóm ngày (viết hoa nhẹ, giãn chữ 0.04em) |

**Quy tắc**
- Cỡ chữ tối thiểu 13px; ô nhập ≥ 16px để iOS không tự phóng to.
- Số tiền định dạng `vi-VN`: `1.250.000 ₫`; khoản thu có tiền tố `+`, khoản chi `−`.
- Căn trái cho văn bản, căn phải cho số tiền.
- Độ dài dòng tối đa ~70 ký tự cho đoạn văn bản.

---

## 4. Khoảng cách & Bố cục

### 4.1 Thang khoảng cách (đơn vị cơ sở 4px)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 48` → token `--space-1 … --space-8`.

- Lề ngoài của trang: **16px** (điện thoại), **24px** (máy tính bảng), **32px** (laptop).
- Khoảng cách giữa các khối lớn: 24px. Bên trong thẻ (padding): 16–20px.

### 4.2 Điểm ngắt (breakpoints)

| Tên | Chiều rộng | Bố cục |
|---|---|---|
| Mobile | < 640px | 1 cột |
| Tablet | 640–1023px | 2 cột cho biểu đồ, 3 cột cho thẻ |
| Desktop | ≥ 1024px | Khung nội dung tối đa 1120px, căn giữa |

### 4.3 Trang chủ

**Điện thoại**
```
┌──────────────────────────┐
│  ‹  Tháng 10/2026  ›     │  ← bộ chọn tháng
├──────────────────────────┤
│ [Số dư        4.250.000₫]│  ← thẻ lớn
│ [Thu 15.0tr] [Chi 10.7tr]│  ← 2 thẻ nhỏ
├──────────────────────────┤
│  Chi tiêu theo danh mục  │
│      (biểu đồ tròn)      │
│      chú giải            │
├──────────────────────────┤
│  Thu vs Chi theo tuần    │
│      (biểu đồ cột)       │
├──────────────────────────┤
│  Giao dịch   [Lọc ▾]     │
│  HÔM NAY · 27/10         │
│  🍜 Ăn trưa     −55.000₫ │
│  🚌 Xe buýt     −12.000₫ │
│  ...                     │
│                    ( + ) │  ← nút nổi
└──────────────────────────┘
```

**Laptop (≥ 1024px)**
```
┌─────────────────────────────────────────────────────┐
│  Sổ Thu Chi            ‹ Tháng 10/2026 ›   [+ Thêm] │
├─────────────────────────────────────────────────────┤
│ [Tổng thu]      [Tổng chi]        [Số dư]           │
├───────────────────────────┬─────────────────────────┤
│  Biểu đồ tròn + chú giải  │  Biểu đồ cột thu vs chi │
├───────────────────────────┴─────────────────────────┤
│  Danh sách giao dịch (nhóm theo ngày)               │
└─────────────────────────────────────────────────────┘
```

### 4.4 Trang Nhập liệu
Một cột, rộng tối đa 480px, căn giữa trên laptop (hiển thị trong modal). Thứ tự từ trên xuống: tiêu đề + nút đóng → công tắc Chi/Thu → số tiền → danh mục → ngày → ghi chú → nút Lưu (cố định đáy trên điện thoại).

### 4.5 Vùng chạm
Mọi phần tử bấm được có kích thước tối thiểu **44 × 44 px**, cách nhau ≥ 8px.

---

## 5. Hình khối & Chiều sâu

**Độ bo góc**

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--radius-sm` | 8px | Chip, ô nhập, nút nhỏ |
| `--radius-md` | 12px | Nút, thẻ danh mục |
| `--radius-lg` | 16px | Thẻ số liệu, thẻ biểu đồ |
| `--radius-xl` | 24px | Modal, bottom sheet (góc trên) |
| `--radius-full` | 999px | Nút nổi, chip tròn, công tắc |

**Đổ bóng (nhẹ, tinh tế)**

| Cấp | Giá trị (sáng) | Dùng cho |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgba(16,24,40,.06)` | Thẻ |
| `--shadow-2` | `0 4px 12px rgba(16,24,40,.10)` | Nút nổi, dropdown |
| `--shadow-3` | `0 16px 40px rgba(16,24,40,.18)` | Modal |

Chế độ tối: giảm bóng, ưu tiên phân tầng bằng độ sáng nền (`--bg` < `--surface` < `--surface-2`) và viền 1px `--border`.

**Viền:** 1px `--border` cho thẻ và ô nhập; trạng thái focus dùng vòng 2px `--primary` cách 2px.

**Lớp phủ (overlay):** `rgba(10,14,22,.5)` phía sau modal/hộp thoại.

**Phân tầng (z-index):** nội dung 0 · thanh đầu trang 10 · nút nổi 20 · modal/overlay 30 · toast 40.

---

## 6. Thành phần giao diện

### 6.1 Bộ chọn tháng
Nút `‹` và `›` (44×44) hai bên, ở giữa chữ "Tháng 10/2026" (H2). Nút `›` bị vô hiệu khi đang ở tháng hiện tại. Bấm vào tên tháng (Could) mở bộ chọn nhanh.

### 6.2 Thẻ số liệu (Summary card)
- Nền `--surface`, bo `--radius-lg`, `--shadow-1`, padding 16–20px.
- Gồm: nhãn (Caption, `--text-muted`) + biểu tượng nhỏ, giá trị (Display hoặc H1, tabular).
- **Tổng thu:** giá trị màu `--income`. **Tổng chi:** `--expense`. **Số dư:** `--text`, âm → `--expense`.
- Trên điện thoại, thẻ Số dư rộng toàn dòng, hai thẻ còn lại chia đôi.

### 6.3 Biểu đồ
- **Biểu đồ tròn (donut):** vành dày, chữ ở giữa hiển thị "Tổng chi" và số tiền. Chú giải bên dưới/bên phải: chấm màu + tên danh mục + số tiền + %. Danh mục chiếm < 3% gộp vào "Khác".
- **Biểu đồ cột:** hai cột cạnh nhau (Thu, Chi) cho mỗi tuần (hoặc ngày); trục Y tối giản, đường lưới `--border`.
- **Tương tác:** hover/chạm hiện tooltip (tên, số tiền, %).
- **Truy cập:** mỗi biểu đồ có nút "Xem dạng bảng" và `aria-label` mô tả tóm tắt; không chỉ truyền đạt bằng màu.

### 6.4 Danh sách giao dịch
- Nhóm theo ngày: tiêu đề nhóm (Overline) + tổng ròng trong ngày ở bên phải (Caption).
- **Dòng giao dịch** (cao ≥ 56px): `[ô biểu tượng danh mục] [Tên danh mục / ghi chú (Caption, cắt 1 dòng)] ........ [±Số tiền]`.
- Số tiền: chi `−55.000 ₫` màu `--expense`; thu `+15.000.000 ₫` màu `--income`.
- Bấm cả dòng để mở chế độ Sửa. Laptop: hiện nút Sửa/Xóa khi hover.
- Đường kẻ ngăn cách 1px `--border`, không dùng thẻ riêng cho từng dòng.

### 6.5 Nút
| Loại | Kiểu dáng | Dùng cho |
|---|---|---|
| Primary | Nền `--primary`, chữ `--primary-contrast`, cao 48px, bo `--radius-md` | Lưu, Lưu thay đổi |
| Secondary | Nền `--surface-2`, chữ `--text` | Hủy, Lọc |
| Danger | Chữ/viền `--danger`, nền trong suốt; khi xác nhận xóa: nền `--danger` | Xóa |
| Ghost / Icon | Trong suốt, 44×44 | Đóng, chuyển tháng |
| FAB (nút nổi) | Tròn 56px, `--primary`, `--shadow-2`, dấu "+" | Thêm (điện thoại, tablet) |

Laptop: thay FAB bằng nút Primary "+ Thêm khoản" ở đầu trang.

### 6.6 Biểu mẫu nhập liệu
- **Công tắc Chi | Thu:** segmented control, 2 đoạn bằng nhau; đoạn đang chọn tô `--expense-soft`/`--income-soft` kèm chữ cùng tông.
- **Số tiền:** ô Display, căn phải, hậu tố "₫", `inputmode="numeric"`, tự thêm dấu chấm ngăn cách hàng nghìn; viền màu theo loại khi focus.
- **Danh mục:** lưới 4 cột (điện thoại) / 4–8 cột (laptop) các ô 72px: biểu tượng + tên (Caption). Ô được chọn có viền `--primary` + nền `--surface-2` + dấu tick.
- **Ngày:** ô ngày gốc của trình duyệt, mặc định hôm nay; chip nhanh "Hôm nay · Hôm qua" (Should).
- **Ghi chú:** ô nhiều dòng tối đa 2 dòng, giới hạn 120 ký tự, đếm ký tự khi còn < 20.
- **Nhãn** luôn hiển thị phía trên ô (không chỉ placeholder); thông báo lỗi nằm dưới ô, màu `--danger` kèm biểu tượng.

### 6.7 Chip lọc
Chip bo tròn: Tất cả · Thu · Chi · theo danh mục. Chip đang chọn nền `--primary`, chữ `--primary-contrast`; chưa chọn nền `--surface-2`.

### 6.8 Hộp thoại xác nhận & Toast
- **Xác nhận xóa:** modal nhỏ (rộng 320–400px): tiêu đề "Xóa khoản này?", mô tả ngắn (số tiền + danh mục), nút `Hủy` (Secondary) và `Xóa` (Danger).
- **Toast:** xuất hiện dưới đáy (trên điện thoại, nằm trên FAB), tự ẩn sau 5 giây; có thể có hành động "Hoàn tác". Dùng `role="status"`.

### 6.9 Điều hướng
Ứng dụng chỉ có hai màn nên không cần thanh điều hướng đáy. Trang chủ là gốc; Nhập liệu mở dạng toàn màn hình (điện thoại) hoặc modal (laptop), có nút `✕`/`←` quay lại. Hỗ trợ phím Esc đóng modal, phím Enter lưu.

---

## 7. Biểu tượng & Hình ảnh

**Bộ biểu tượng:** một bộ nét đồng nhất, dạng line 24px, nét 1.75px, đầu bo tròn (gợi ý: Lucide hoặc Phosphor Regular, nhúng dạng SVG inline). Không dùng emoji ở bản chính thức để tránh khác biệt giữa các hệ điều hành (các sơ đồ trên chỉ minh họa).

| Danh mục | Biểu tượng gợi ý |
|---|---|
| Ăn uống | `utensils` |
| Di chuyển | `bus` / `car` |
| Nhà ở | `home` |
| Mua sắm | `shopping-bag` |
| Giải trí | `film` / `gamepad` |
| Sức khỏe | `heart-pulse` |
| Học tập | `book-open` |
| Khác (chi) | `circle-ellipsis` |
| Lương | `wallet` |
| Thưởng | `gift` |
| Thu nhập phụ | `trending-up` |
| Khác (thu) | `plus-circle` |

**Ô biểu tượng danh mục:** hình tròn/vuông bo 40px, nền là màu danh mục ở độ mờ 15%, biểu tượng ở màu danh mục đậm.

**Biểu tượng chức năng:** thêm `plus`, sửa `pencil`, xóa `trash-2`, đóng `x`, chuyển tháng `chevron-left/right`, lọc `filter`, hoàn tác `undo-2`, tick `check`.

**Hình ảnh:** không dùng ảnh chụp. Trạng thái rỗng dùng một minh họa đường nét đơn giản (cuốn sổ trống), nhúng SVG, tông `--text-muted`. Favicon/biểu tượng ứng dụng: hình ví hoặc đồng xu trên nền `--primary`, bo góc, có bản 192px và 512px (cho PWA – Could).

**Văn bản thay thế:** biểu tượng trang trí `aria-hidden="true"`; biểu tượng đứng một mình (nút) bắt buộc có `aria-label`.

---

## 8. Chuyển động

**Nguyên tắc:** chuyển động ngắn, mượt, có mục đích (báo trạng thái, giữ ngữ cảnh), không gây phân tâm.

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--dur-fast` | 120ms | Hover, nhấn nút, đổi chip |
| `--dur-base` | 200ms | Mở/đóng modal, đổi tab |
| `--dur-slow` | 400ms | Vẽ biểu đồ, đếm số |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Xuất hiện |
| `--ease-in` | `cubic-bezier(.4,0,1,1)` | Biến mất |

| Tình huống | Chuyển động |
|---|---|
| Mở Nhập liệu | Điện thoại: trượt lên từ đáy 200ms; laptop: modal mờ dần + phóng nhẹ 0.98 → 1 |
| Đóng Nhập liệu | Ngược lại, 160ms |
| Đổi tháng | Nội dung mờ chéo (cross-fade) 200ms; con số đếm từ giá trị cũ → mới trong 400ms |
| Vẽ biểu đồ | Vành donut quét từ 0 → 100%, cột mọc từ đáy lên, 400ms (chỉ lần đầu và khi đổi tháng) |
| Thêm giao dịch mới | Dòng mới trượt xuống + nổi nền `--primary` 10% rồi tắt trong 1.2 giây |
| Xóa giao dịch | Dòng thu chiều cao + mờ dần 200ms |
| Nhấn nút | Thu nhỏ 0.97 trong 120ms |
| Toast | Trượt lên + mờ dần vào, tự ẩn sau 5 giây |
| Lỗi form | Ô lỗi rung ngang nhẹ (±4px, 200ms) và hiện thông báo |

**Giảm chuyển động:** với `@media (prefers-reduced-motion: reduce)`, tắt trượt/phóng/đếm số/vẽ biểu đồ; chỉ giữ mờ dần rất ngắn hoặc đổi tức thì.

---

## 9. Trạng thái giao diện

### 9.1 Trạng thái thành phần tương tác

| Trạng thái | Cách thể hiện |
|---|---|
| Mặc định | Theo mô tả ở mục 6 |
| Hover (laptop) | Nền sáng/tối thêm ~6%, con trỏ `pointer` |
| Focus (bàn phím) | Vòng 2px `--primary`, cách 2px; không bao giờ ẩn outline |
| Active/Pressed | Thu nhỏ 0.97, nền đậm thêm ~10% |
| Selected | Viền/nền `--primary` + dấu tick (không chỉ đổi màu) |
| Disabled | Độ mờ 40%, `cursor: not-allowed`, `aria-disabled` |
| Loading (nút) | Hiện spinner nhỏ, khóa nút, giữ nguyên chiều rộng |

### 9.2 Trạng thái màn hình

| Tình huống | Hiển thị |
|---|---|
| **Lần đầu mở (chưa có dữ liệu)** | Minh họa sổ trống + "Chưa có khoản nào. Ghi khoản đầu tiên của bạn" + nút **Thêm khoản** |
| **Tháng không có giao dịch** | Thẻ tổng hiện `0 ₫`, biểu đồ ẩn và thay bằng "Chưa có chi tiêu trong tháng này" |
| **Chỉ có thu, chưa có chi** | Biểu đồ tròn ẩn kèm thông báo; thẻ và biểu đồ cột vẫn hiển thị |
| **Đang tải** | Skeleton cho thẻ, biểu đồ và danh sách (nền `--surface-2`, nhấp nháy nhẹ); chỉ hiện nếu tải > 200ms |
| **Số dư âm** | Giá trị Số dư màu `--expense` kèm dấu `−` |
| **Số tiền rất lớn** | Thẻ rút gọn (vd. `15,2 tr`) khi không đủ chỗ; danh sách vẫn hiển thị đầy đủ |
| **Ghi chú dài** | Cắt 1 dòng với dấu `…` ở danh sách; hiển thị đầy đủ ở màn Sửa |

### 9.3 Trạng thái form

| Tình huống | Thông báo |
|---|---|
| Số tiền trống/0 | "Nhập số tiền lớn hơn 0" |
| Chưa chọn danh mục | "Chọn một danh mục" |
| Chưa chọn ngày/ngày không hợp lệ | "Chọn ngày hợp lệ" |
| Ghi chú quá dài | "Tối đa 120 ký tự" |
| Lưu thành công | Toast "Đã lưu" |
| Sửa thành công | Toast "Đã cập nhật" |
| Có thay đổi chưa lưu và bấm đóng | Hộp thoại "Bỏ thay đổi?" |

Lỗi hiện khi người dùng rời ô (blur) hoặc bấm Lưu; focus tự chuyển tới ô lỗi đầu tiên.

### 9.4 Trạng thái lỗi hệ thống

| Tình huống | Hiển thị |
|---|---|
| Không ghi được vào bộ nhớ (đầy/bị chặn) | Banner `--warning`/`--danger` trên cùng: "Không thể lưu dữ liệu. Kiểm tra bộ nhớ hoặc chế độ riêng tư của trình duyệt." |
| Dữ liệu lưu bị hỏng/không đọc được | Thông báo + tùy chọn "Bắt đầu lại" (kèm xác nhận) |
| Mất mạng | Không ảnh hưởng (dữ liệu local); với PWA hiển thị chấm "Offline" nhỏ (Could) |

### 9.5 Trạng thái xóa
Xác nhận → xóa → toast **"Đã xóa · Hoàn tác"** (5 giây). Nếu bấm Hoàn tác, khoản được khôi phục đúng vị trí và số liệu cập nhật lại.

### 9.6 Truy cập
Toàn bộ trạng thái đều có thể thao tác bằng bàn phím và đọc được bằng trình đọc màn hình: thông báo lỗi dùng `aria-live="polite"`, toast dùng `role="status"`, modal giữ focus bên trong (focus trap) và trả focus về nút gọi khi đóng.

---

## 10. Bổ sung giao diện cho các hạng mục PRD còn thiếu (v1.1)

> Mục này **bổ sung**, không thay đổi nội dung mục 1–9. Mọi thành phần mới dùng lại token màu, chữ, bo góc, đổ bóng, chuyển động đã định nghĩa ở mục 2, 3, 5, 8. Chỗ nào mở rộng một quy tắc cũ (vd. 6.9 "chỉ có hai màn") sẽ được nêu rõ.

### 10.0 Đối chiếu PRD ↔ DESIGN

| Hạng mục trong PRD | Mức phủ ở mục 1–9 | Bổ sung tại |
|---|---|---|
| Điểm vào cho Tìm kiếm / Cài đặt (header Trang chủ) | Chưa có: header chỉ có tên app, chọn tháng, nút Thêm | 10.1 |
| F-14 Chế độ tối – bật/tắt thủ công | Chỉ có bảng màu, chưa có điều khiển | 10.2 |
| F-15 / US-12 Xuất/nhập CSV, JSON | **Chưa có giao diện** | 10.2, 10.3 |
| F-16 Tìm kiếm theo ghi chú | **Chưa có giao diện** | 10.4 |
| F-12 / US-10 Lọc danh sách | Có chip (6.7) và nút "Lọc ▾" nhưng chưa nói nút mở gì | 10.5 |
| F-11 Biểu đồ cột, "Xem dạng bảng" (PRD §8) | Có mô tả chung (6.3), thiếu bố cục, chọn Ngày/Tuần, bảng thay thế | 10.6 |
| F-06, F-07 Sửa/Xóa (PRD 6.4, 6.5) | Form dùng chung có; thiếu giao diện chế độ Sửa và thao tác "vuốt/menu trên dòng" | 10.7 |
| F-08 Chọn tháng nhanh (Could) | Chỉ nhắc 1 câu ở 6.1 | 10.8 |
| F-17 Cài như app (PWA), offline | Chỉ có chấm "Offline" và icon | 10.9 |
| Rủi ro mất dữ liệu (PRD §8), lỗi lưu trữ, dữ liệu hỏng | Chỉ có mô tả chữ ở 9.3–9.4, chưa có bố cục | 10.10 |

Đã phủ đủ, không cần bổ sung: F-01, F-02, F-03, F-04, F-05, F-08 (nút ‹ ›), F-09, F-10, F-13.

---

### 10.1 Header Trang chủ (điểm vào mới)

**(1) Bố cục tổng thể** – Thanh đầu trang cố định (sticky, z-index 10), cao 56px, nền `--surface`, viền dưới 1px `--border`. *Mở rộng mục 4.3 và 6.9.*

Điện thoại:
```
┌──────────────────────────┐
│ Sổ Thu Chi        ⌕   ⚙  │  ← thanh trên
├──────────────────────────┤
│  ‹  Tháng 10/2026  ›     │  ← bộ chọn tháng (6.1)
└──────────────────────────┘
```
Laptop:
```
│ Sổ Thu Chi   ‹ Tháng 10/2026 ›   [⌕ Tìm ghi chú…]  ⚙  [+ Thêm] │
```

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Tên app | Chữ H2, `--text`, căn trái; kèm biểu tượng app 24px |
| Nút Tìm kiếm | Icon `search`, 44×44, Ghost. Laptop: thay bằng ô tìm kiếm rộng 240px |
| Nút Cài đặt | Icon `settings`, 44×44, Ghost, mở panel 10.2 |
| Chip Offline | Hiện khi mất mạng (10.9) |

**(3) Màu & chữ** – Icon `--text-muted`, hover/pressed `--text`; focus vòng 2px `--primary`. Tên app H2 (18/26, 600).

**(4) Điện thoại** – Chỉ hiện 2 icon; nút "+ Thêm" vẫn là FAB (6.5). Khi cuộn xuống, thanh trên vẫn cố định, bộ chọn tháng cuộn đi.

---

### 10.2 Panel Cài đặt & Dữ liệu (F-14, F-15, F-17)

Không phải màn hình thứ ba: là panel phủ lên Trang chủ, giống cách Nhập liệu mở dạng modal.

**(1) Bố cục tổng thể**
```
┌─ Cài đặt ──────────── ✕ ┐
│ GIAO DIỆN               │
│ Chế độ màu              │
│ [ Tự động | Sáng | Tối ]│
│                         │
│ DỮ LIỆU                 │
│ ⓘ Dữ liệu chỉ lưu trên  │
│   trình duyệt này.      │
│ ⬇ Xuất dữ liệu        › │
│ ⬆ Nhập dữ liệu        › │
│ Sao lưu gần nhất:       │
│ 12/10/2026              │
│                         │
│ ỨNG DỤNG                │
│ ⬇ Cài lên màn hình    › │
│ Phiên bản 1.1           │
└─────────────────────────┘
```

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Tiêu đề + nút đóng | "Cài đặt" (H1), icon `x` 44×44 |
| Tiêu đề nhóm | Overline, `--text-muted` |
| Công tắc Chế độ màu | Segmented 3 đoạn: Tự động / Sáng / Tối. Đoạn chọn: nền `--primary`, chữ `--primary-contrast` (không dùng màu thu/chi) |
| Hộp ghi chú | Nền `--surface-2`, bo `--radius-md`, icon `info`, chữ Caption: "Dữ liệu chỉ lưu trên trình duyệt này. Hãy sao lưu định kỳ." |
| Dòng hành động | Cao ≥ 56px: icon + nhãn (Body) + `chevron-right`; bấm mở 10.3 |
| Dòng "Sao lưu gần nhất" | Caption `--text-muted`; chưa từng sao lưu → "Chưa sao lưu" màu `--warning` kèm icon |
| Dòng Cài lên màn hình | Chỉ hiện khi trình duyệt hỗ trợ (xem 10.9) |

**(3) Màu & chữ** – Nền panel `--surface`, đường kẻ `--border`, bo `--radius-xl`, đổ bóng `--shadow-3`, overlay `rgba(10,14,22,.5)`. Nhãn Body 16/24, giá trị phụ Caption 13/18.

**(4) Điện thoại** – Bottom sheet cao 90% màn hình, bo góc trên `--radius-xl`, có thanh kéo nhỏ ở đầu, vuốt xuống để đóng. Laptop: panel trượt từ phải, rộng 400px, toàn chiều cao.

---

### 10.3 Xuất / Nhập dữ liệu (F-15, US-12)

**(1) Bố cục tổng thể** – Hai hộp thoại riêng, mở từ panel 10.2. Điện thoại: bottom sheet. Laptop: modal giữa, rộng 480px.

*Xuất dữ liệu*
```
┌─ Xuất dữ liệu ───────── ✕ ┐
│ Định dạng                 │
│ (●) JSON – đầy đủ, dùng   │
│     để khôi phục          │
│ ( ) CSV – mở bằng Excel   │
│ Phạm vi                   │
│ [ Toàn bộ | Tháng đang xem]│
│ 128 khoản sẽ được xuất    │
│ [      Tải xuống        ] │
└───────────────────────────┘
```
*Nhập dữ liệu*
```
┌─ Nhập dữ liệu ───────── ✕ ┐
│ ┌ - - - - - - - - - - - ┐ │
│ │  Kéo thả tệp vào đây  │ │
│ │  hoặc [Chọn tệp]      │ │
│ └ - - - - - - - - - - - ┘ │
│ ✓ so-thu-chi_2026-10.json │
│ Tìm thấy 120 khoản        │
│  · 5 trùng · 2 lỗi        │
│ (●) Gộp, bỏ khoản trùng   │
│ ( ) Thay thế toàn bộ      │
│ [ Hủy ]      [   Nhập   ] │
└───────────────────────────┘
```

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Radio lớn | Ô cao ≥ 56px, bo `--radius-md`, viền `--border`; được chọn: viền `--primary` + nền `--surface-2` + dấu tick |
| Segmented Phạm vi | Cùng kiểu 10.2 |
| Dòng đếm | Caption `--text-muted`: "128 khoản sẽ được xuất" |
| Nút Tải xuống / Nhập | Primary, rộng toàn dòng ở điện thoại. Tên tệp xuất: `so-thu-chi_YYYY-MM-DD.json` hoặc `.csv` |
| Vùng thả tệp | Viền nét đứt 2px `--border`, bo `--radius-lg`, nền `--surface-2`; khi kéo tệp lên: viền `--primary` |
| Thẻ xem trước | Tên tệp + icon `file-text`; số khoản hợp lệ, trùng (`--warning`), lỗi (`--danger`) kèm icon, không chỉ dựa vào màu |
| Xác nhận thay thế | Chọn "Thay thế toàn bộ" rồi bấm Nhập → hộp thoại Danger: "Thay thế toàn bộ dữ liệu hiện có? Không thể hoàn tác." |

**(3) Màu & chữ** – Dùng token mục 2; tiêu đề H1, nhãn nhóm Overline, nội dung Body. Số liệu đếm dùng `tabular-nums`.

**(4) Điện thoại** – Ẩn vùng kéo thả, chỉ còn nút "Chọn tệp" 48px. Nút hành động dính đáy sheet, xếp dọc (Primary trên, Secondary dưới).

**Trạng thái:** đang đọc tệp (spinner trong nút) · tệp sai định dạng ("Tệp không hợp lệ. Hãy chọn tệp .json hoặc .csv do Sổ Thu Chi xuất ra", viền `--danger`) · không có khoản hợp lệ (khóa nút Nhập) · thành công (toast "Đã nhập 118 khoản") · xuất thành công (toast "Đã xuất 128 khoản").

---

### 10.4 Tìm kiếm theo ghi chú (F-16)

**(1) Bố cục tổng thể** – Khi tìm kiếm, khu vực biểu đồ và thẻ tổng quan được ẩn, thay bằng danh sách kết quả.
```
┌──────────────────────────┐
│ ← [ cà phê          ✕ ]  │  ← thanh tìm kiếm
│ [Tất cả tháng][Tháng này]│
│ 12 kết quả · −640.000 ₫  │
│ THÁNG 10/2026            │
│ 27/10  Cà phê   −45.000₫ │
│ ...                      │
└──────────────────────────┘
```

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Ô tìm kiếm | Cao 44px, nền `--surface-2`, bo `--radius-full`, icon `search` bên trái, nút xóa `x` bên phải khi có chữ, placeholder "Tìm trong ghi chú…" |
| Chip phạm vi | "Tất cả tháng" (mặc định) / "Tháng này"; kiểu chip 6.7 |
| Dòng tóm tắt | Caption: số kết quả + tổng ròng (màu theo dấu) |
| Kết quả | Dùng lại dòng giao dịch 6.4, nhóm Tháng → Ngày; từ khớp được tô nền `--primary` 15% (cùng quy tắc ô biểu tượng), chữ giữ nguyên |
| Trạng thái rỗng | Icon `search-x` + "Không tìm thấy khoản nào khớp “…”" + nút Ghost "Xóa tìm kiếm" |

**(3) Màu & chữ** – Ô nhập Body 16px (tránh iOS phóng to); không phân biệt hoa/thường và dấu tiếng Việt khi so khớp. Tìm sau khi ngừng gõ 200ms.

**(4) Điện thoại** – Chạm icon `search` thì thanh trên đổi thành thanh tìm kiếm (nút `←` quay lại, ô nhập tự focus, bàn phím bật). Laptop: ô tìm kiếm nằm sẵn trong header; phím tắt `/` focus vào ô; `Esc` thoát.

---

### 10.5 Bộ lọc danh sách (F-12, US-10)

**(1) Bố cục tổng thể** – Hàng điều khiển ở đầu khu "Giao dịch" (cụ thể hóa nút "Lọc ▾" ở mục 4.3):
```
Giao dịch
[Tất cả][Thu][Chi]         [⚲ Lọc ②]
Đang lọc: [Ăn uống ✕][Di chuyển ✕]  Xóa lọc
Hiển thị 14/52 khoản · −1.280.000 ₫
```
Bấm "Lọc" mở panel chi tiết:
```
┌─ Lọc giao dịch ──────── ✕ ┐
│ Loại                      │
│ [ Tất cả | Thu | Chi ]    │
│ Danh mục                  │
│ [Ăn uống✓][Di chuyển✓]    │
│ [Nhà ở][Mua sắm][Giải trí]│
│ [Đặt lại]     [Áp dụng]   │
└───────────────────────────┘
```

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Chip nhanh Tất cả/Thu/Chi | Chip 6.7, chọn một; cuộn ngang nếu thiếu chỗ |
| Nút Lọc | Secondary, cao 44px, icon `filter`; có huy hiệu tròn `--primary` hiện số bộ lọc đang bật |
| Chip bộ lọc đang bật | Chip có `x` để gỡ từng cái; nút Ghost "Xóa lọc" |
| Chọn danh mục | Nhiều lựa chọn; chip kèm icon danh mục, đang chọn: nền `--primary`, có dấu tick. Danh sách đổi theo Loại (Chi → 8 danh mục chi; Thu → 4 danh mục thu; Tất cả → hiển thị cả hai nhóm) |
| Nút Đặt lại / Áp dụng | Secondary / Primary |
| Dòng tóm tắt | Caption `--text-muted`: "Hiển thị 14/52 khoản · tổng" |
| Trạng thái rỗng | "Không có khoản nào khớp bộ lọc" + nút "Xóa lọc" |

**(3) Màu & chữ** – Tiêu đề panel H1/H2, nhãn nhóm Overline, chip Caption 13px/500. Không dùng `--income`/`--expense` để tô chip Thu/Chi đang chọn (giữ `--primary`) để màu thu/chi chỉ xuất hiện ở số tiền.

**(4) Điện thoại** – Bottom sheet, nút Đặt lại/Áp dụng dính đáy, chia đôi 50/50. Laptop: popover rộng 320px neo dưới nút Lọc (`--shadow-2`, bo `--radius-lg`).

**Phạm vi:** bộ lọc chỉ ảnh hưởng **danh sách**; thẻ tổng quan và biểu đồ luôn tính trên cả tháng. Chuyển tháng giữ nguyên bộ lọc.

---

### 10.6 Biểu đồ cột chi tiết & dạng bảng (F-11)

**(1) Bố cục tổng thể** – Thẻ biểu đồ (nền `--surface`, `--radius-lg`, `--shadow-1`):
```
┌────────────────────────────────┐
│ Thu vs Chi      [Tuần|Ngày] ▦  │  ← H2 + chọn kỳ + nút bảng
│ ■ Thu  ■ Chi                   │  ← chú giải
│ 10tr ┤        ▇                │
│  5tr ┤   ▇ ▅  ▇ ▃              │
│    0 ┴──T1──T2──T3──T4──T5     │
└────────────────────────────────┘
```

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Chọn kỳ | Segmented nhỏ (cao 36px, vùng chạm mở rộng 44px): **Tuần** (mặc định) / **Ngày** |
| Nút "Xem bảng" | Icon `table`, Ghost 44×44, `aria-pressed`; bật thì đổi thành `bar-chart-2` ("Xem biểu đồ") |
| Chú giải | Chấm vuông `--income` "Thu", `--expense` "Chi", Caption |
| Cột | Hai cột sát nhau mỗi kỳ, đỉnh bo 4px; Thu `--income`, Chi `--expense`; rộng tối thiểu 12px |
| Trục | Trục Y 3 vạch lưới `--border`, nhãn rút gọn (`5tr`), Caption `--text-muted`; trục X: "T1…T5" hoặc "1…31" |
| Tooltip | Hover/chạm: "Tuần 2 (8–14/10)", Thu +…, Chi −…; nền `--surface`, `--shadow-2` |
| Bảng thay thế | Cột: Kỳ · Thu · Chi · Chênh lệch; dòng cao 48px, số căn phải, `tabular-nums`; Chênh lệch có dấu +/− và màu thu/chi; dòng cuối "Tổng" in đậm |

Biểu đồ tròn cũng có nút "Xem bảng" cùng kiểu: bảng Danh mục · Số tiền · %.

**(3) Màu & chữ** – Đúng mục 2.3 (Thu = `--income`, Chi = `--expense`). Tiêu đề H2, nhãn trục Caption, ô bảng Body, tiêu đề cột Overline.

**(4) Điện thoại** – Chiều cao biểu đồ 200px (laptop 260px). Chế độ Tuần luôn vừa màn hình. Chế độ Ngày: vùng biểu đồ cuộn ngang (rộng tối thiểu 31 × 20px), nhãn trục X hiện mỗi 5 ngày, trục Y cố định bên trái. Bảng Ngày cuộn dọc trong thẻ (tối đa 320px, tiêu đề dính trên).

**Trạng thái:** không có dữ liệu → "Chưa có thu/chi trong tháng này"; kỳ không có phát sinh → cột 0 hiện vạch mỏng 2px.

---

### 10.7 Chế độ Sửa & thao tác trên dòng (F-06, F-07)

**(1) Bố cục tổng thể** – Dùng lại màn Nhập liệu (4.4) với các khác biệt sau:
```
┌─ Sửa khoản ──────────── ✕ ┐
│ [ Chi | Thu ]             │
│ Số tiền       55.000 ₫    │
│ Danh mục  [lưới, đã chọn] │
│ Ngày    27/10/2026        │
│ Ghi chú   Ăn trưa         │
│ Tạo 27/10 12:05 · Sửa 27/10 12:40
│ [🗑 Xóa]  [ Lưu thay đổi ]│
└───────────────────────────┘
```

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Tiêu đề | "Sửa khoản" (thay cho "Thêm khoản") |
| Nút Lưu thay đổi | Primary; **vô hiệu** cho đến khi có thay đổi |
| Nút Xóa | Danger kiểu viền + icon `trash-2`, mở hộp thoại 6.8 |
| Dòng thời gian | Caption `--text-muted`: "Tạo … · Sửa lần cuối …" (từ `createdAt`, `updatedAt`) |
| Đổi loại Chi ↔ Thu | Nếu danh mục đang chọn không thuộc loại mới: bỏ chọn danh mục và hiện gợi ý "Chọn lại danh mục" |
| Thao tác vuốt (điện thoại) | Vuốt dòng sang trái hiện hai nút vuông 72px: **Sửa** (nền `--primary`) và **Xóa** (nền `--danger`), icon + nhãn Caption trắng. Không tự xóa khi vuốt hết; bấm Xóa mới mở hộp thoại xác nhận |
| Menu dòng (laptop) | Hover/focus hiện icon `pencil` và `trash-2` (Ghost 44×44), thêm nút `more-vertical` mở menu Sửa / Xóa cho người dùng bàn phím |

**(3) Màu & chữ** – Giữ nguyên 6.6. Nút trên nền màu phải đạt tương phản ≥ 4.5:1 (chữ `--primary-contrast` trên `--primary`, chữ trắng trên `--danger`).

**(4) Điện thoại** – Toàn màn hình; thanh đáy cố định gồm [Xóa] chiếm 1/3 và [Lưu thay đổi] chiếm 2/3, cao 48px. Vuốt có cách thay thế không cần cử chỉ: chạm dòng → màn Sửa → Xóa. Laptop: modal 480px, chân modal: Xóa nằm trái, Hủy + Lưu thay đổi nằm phải.

---

### 10.8 Bộ chọn tháng nhanh (Could)

**(1) Bố cục tổng thể** – Mở khi bấm vào chữ "Tháng 10/2026":
```
┌──────────────────────┐
│  ‹      2026      ›  │
│ [T1][T2][T3][T4]     │
│ [T5][T6][T7][T8]     │
│ [T9][T10][T11][T12]  │
│ [Về tháng này]       │
└──────────────────────┘
```

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Chọn năm | `‹ 2026 ›`, H2, nút 44×44 |
| Lưới tháng | 3 hàng × 4 cột, ô cao 48px, bo `--radius-sm`, nhãn Body; tháng đang xem: nền `--primary`, chữ `--primary-contrast`; tháng hiện tại: viền `--primary` |
| Chấm dữ liệu | Chấm 4px `--text-muted` dưới nhãn nếu tháng đó có giao dịch |
| Tháng tương lai | Vô hiệu (độ mờ 40%) |
| Nút "Về tháng này" | Ghost, căn giữa |

**(3) Màu & chữ** – Nền `--surface`, `--shadow-2`, bo `--radius-lg`; chữ Body.

**(4) Điện thoại** – Bottom sheet thấp (chiều cao theo nội dung); laptop: popover 320px neo dưới tên tháng. Hỗ trợ phím mũi tên để di chuyển giữa các ô, Enter để chọn.

---

### 10.9 Cài như app & chế độ Offline (F-17, Could)

**(1) Bố cục tổng thể** – Thẻ mời cài app đặt **trên cùng nội dung**, ngay dưới bộ chọn tháng, chỉ hiện một lần cho tới khi bị đóng:
```
┌────────────────────────────────┐
│ [▣] Cài Sổ Thu Chi lên màn hình│
│     Mở nhanh, dùng cả khi không│
│     có mạng                    │
│          [Để sau]  [ Cài đặt ] │
└────────────────────────────────┘
```

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Thẻ mời cài | Nền `--surface`, viền 1px `--border`, bo `--radius-lg`; biểu tượng app 40px; tiêu đề Body-strong, mô tả Caption `--text-muted` |
| Nút Cài đặt / Để sau | Primary / Ghost, cao 44px. Bấm "Để sau": ẩn và nhớ lựa chọn (localStorage), vẫn còn mục "Cài lên màn hình" trong Cài đặt |
| Hướng dẫn iOS Safari | Trình duyệt không có lời nhắc cài: thay nút bằng dòng "Bấm `share` rồi chọn *Thêm vào MH chính*" |
| Chip Offline | Trên header: chấm `--warning` + chữ "Offline" (Caption); chạm hiện tooltip "Bạn đang offline. Dữ liệu vẫn được lưu trên máy." |
| Toast cập nhật | "Có phiên bản mới" + nút "Tải lại" (không tự tải lại khi đang nhập liệu) |

**(3) Màu & chữ** – Chip Offline: nền `--surface-2`, chữ `--text` (chữ không đặt trực tiếp trên màu `--warning`, chỉ chấm dùng `--warning`).

**(4) Điện thoại** – Thẻ mời rộng toàn dòng; hai nút xếp ngang, "Cài đặt" bên phải. Khi chạy ở chế độ đã cài (standalone), chừa vùng an toàn `env(safe-area-inset-*)` cho thanh trên, FAB và thanh đáy. Laptop: thẻ mời gọn trong một dòng, nút ở bên phải.

---

### 10.10 Nhắc sao lưu & hộp thoại hệ thống

Cụ thể hóa các thông báo ở 9.3–9.4 và cảnh báo mất dữ liệu ở PRD §8.

**(1) Bố cục tổng thể**

*Banner nhắc sao lưu / lỗi lưu trữ* – thanh ngang nằm dưới header, trên nội dung, không che giao diện:
```
┌────────────────────────────────────────┐
│ ⚠ Bạn chưa sao lưu trong 30 ngày.      │
│                   [Nhắc sau] [Sao lưu] │
└────────────────────────────────────────┘
```
*Hộp thoại* – modal giữa, rộng 320–400px, bo `--radius-xl`, `--shadow-3`.

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Banner nhắc sao lưu | Hiện khi quá 30 ngày chưa xuất **và** có ≥ 20 khoản. Nền `--surface-2`, vạch trái 4px `--warning`, icon `alert-triangle`; nút "Sao lưu" (mở 10.3) và "Nhắc sau" (ẩn 7 ngày) |
| Banner lỗi lưu trữ | Nền `--danger` ở độ mờ 12%, vạch trái 4px `--danger`, icon `alert-octagon`; nội dung theo 9.4; nút "Xuất dữ liệu" và `x` đóng |
| Hộp thoại "Bỏ thay đổi?" | Nội dung: "Các thay đổi chưa lưu sẽ mất." Nút **Tiếp tục sửa** (Secondary) / **Bỏ thay đổi** (Danger) |
| Hộp thoại "Không đọc được dữ liệu" | Icon `alert-circle` màu `--danger`; mô tả: "Dữ liệu lưu trên máy bị lỗi. Bạn có thể khôi phục từ tệp sao lưu hoặc bắt đầu lại." Nút **Nhập từ tệp sao lưu** (Primary, mở 10.3) / **Bắt đầu lại** (Danger) |
| Xác nhận "Bắt đầu lại" | Bước hai: "Xóa toàn bộ dữ liệu hiện có? Không thể hoàn tác." Nút Hủy / Xóa hết |

**(3) Màu & chữ** – Tiêu đề hộp thoại H2, nội dung Body, nội dung banner Body 16px (hoặc Caption nếu hẹp); chữ luôn `--text`, màu cảnh báo chỉ ở vạch, nền nhạt và icon, vì vậy không phụ thuộc vào màu để hiểu nghĩa.

**(4) Điện thoại** – Banner chiếm toàn chiều rộng, nội dung xuống dòng, nút nằm hàng dưới căn phải. Hộp thoại rộng `calc(100% − 32px)`; dưới 400px thì các nút xếp dọc, nút chính ở trên, mỗi nút cao 48px.

---

### 10.11 Quy ước chung cho thành phần mới

| Hạng mục | Quy ước |
|---|---|
| Phân tầng (bổ sung mục 5) | Banner trong luồng nội dung (0) · thanh đầu trang 10 · FAB 20 · popover 25 · sheet/panel/modal/overlay 30 · toast 40 |
| Chuyển động | Sheet/panel: trượt 200ms (`--dur-base`, `--ease-out`). Popover: mờ dần + dịch 4px, 120ms. Vuốt dòng: bám theo ngón tay, nảy về vị trí 160ms. Đổi Biểu đồ ↔ Bảng và Tuần ↔ Ngày: cross-fade 200ms. Tôn trọng `prefers-reduced-motion` như mục 8 |
| Truy cập | Sheet/modal: focus trap, `Esc` đóng, trả focus về nút gọi; segmented dùng `role="radiogroup"`; nút bật/tắt dùng `aria-pressed`; banner dùng `role="status"` (lỗi lưu trữ dùng `role="alert"`) |
| Vùng chạm & chữ | Mọi điều khiển mới ≥ 44×44px; chữ tối thiểu 13px; ô nhập 16px |
| Lưu lựa chọn người dùng | Chế độ màu, tuỳ chọn "Để sau" của thẻ cài app, "Nhắc sau" sao lưu: lưu ở localStorage, bọc try/catch, ứng dụng vẫn hoạt động đúng khi không lưu được |

---

## 11. Bổ sung giao diện còn thiếu – Máy tính bảng & Trạng thái màn hình (v1.2)

> Mục này **chỉ bổ sung**, không thay đổi nội dung mục 1–10. Dùng lại toàn bộ token ở mục 2, 3, 4, 5, 8. Lý do bổ sung: sau khi đối chiếu lại với PRD (mục 4.1, 7.3, F-10, F-13), mục 1–10 đã mô tả đầy đủ điện thoại và laptop, nhưng **chưa có bố cục cho máy tính bảng (640–1023px)** và các trạng thái rỗng / tải / lỗi mới chỉ có chữ, **chưa có bố cục**.

### 11.0 Đối chiếu PRD ↔ DESIGN (lần 2)

| Hạng mục trong PRD | Mức phủ ở mục 1–10 | Bổ sung tại |
|---|---|---|
| PRD 7.3 – Trang chủ trên máy tính bảng (thẻ 3 cột, biểu đồ 2 cột) | Chỉ có 1 dòng ở bảng 4.2, **chưa có bố cục** | 11.1 |
| PRD 7.3 – Nhập liệu trên máy tính bảng ("toàn màn hình hoặc hộp thoại giữa") | Chỉ mô tả điện thoại (toàn màn hình) và laptop (modal) | 11.2 |
| PRD 7.1/7.3 – Danh sách "bên dưới/bên cạnh" ở laptop | Chỉ có phương án "bên dưới" (4.3) | 11.3 |
| Các panel mới ở mục 10 (Cài đặt, Xuất/Nhập, Lọc, Chọn tháng, Tìm kiếm) | Chỉ có điện thoại và laptop | 11.4 |
| F-13 / M2 – Trạng thái rỗng, tải (skeleton), lỗi | Chỉ có bảng chữ ở 9.2–9.4, **chưa có bố cục** | 11.5 |
| PRD 7.1 – Nút "+ Thêm" luôn hiển thị | Có FAB (6.5), chưa nói rõ vị trí khi cuộn / có toast / có bàn phím ảo | 11.6 |

Đã phủ đủ, không cần bổ sung: F-01 … F-12, F-14 … F-17, M1 … M7 (đã bổ sung ở mục 10).

---

### 11.1 Trang chủ trên máy tính bảng (640 – 1023px)

**(1) Bố cục tổng thể** – Lề ngoài 24px (mục 4.1), nội dung rộng toàn khung, không giới hạn 1120px. Thanh trên giống điện thoại nhưng có thêm chữ cho nút Cài đặt. Thẻ tổng 3 cột, hai biểu đồ đặt cạnh nhau, danh sách nằm bên dưới chiếm toàn chiều ngang.
```
┌────────────────────────────────────────────────────┐
│ Sổ Thu Chi              [⌕ Tìm]  [⚙ Cài đặt]       │ ← header 56px
├────────────────────────────────────────────────────┤
│              ‹  Tháng 10/2026  ›                   │ ← bộ chọn tháng
├────────────────────────────────────────────────────┤
│ [Tổng thu    ] [Tổng chi    ] [Số dư       ]       │ ← 3 thẻ bằng nhau
│ [15.000.000₫ ] [10.750.000₫ ] [4.250.000₫  ]       │
├──────────────────────────┬─────────────────────────┤
│ Chi tiêu theo danh mục   │ Thu vs Chi  [Tuần|Ngày] │
│ (donut 180px) + chú giải │ (biểu đồ cột, cao 220px)│
├──────────────────────────┴─────────────────────────┤
│ Giao dịch   [Tất cả][Thu][Chi]        [⚲ Lọc]      │
│ HÔM NAY · 27/10                          −67.000₫  │
│ 🍜 Ăn trưa                               −55.000₫  │
│ ...                                        ( + )   │ ← FAB
└────────────────────────────────────────────────────┘
```

**(2) Thành phần**

| Thành phần | Mô tả |
|---|---|
| Header | Giống 10.1 (điện thoại) nhưng nút Tìm và Cài đặt là nút Ghost có **icon + chữ** (cao 44px) vì còn chỗ; chip Offline (10.9) nằm giữa tên app và các nút |
| Bộ chọn tháng | Căn giữa, nằm dưới header, không dính khi cuộn |
| Thẻ số liệu | 3 thẻ ngang bằng nhau (không còn thẻ Số dư rộng toàn dòng như điện thoại); thứ tự **Tổng thu – Tổng chi – Số dư**; giá trị H1 (24/32) |
| Thẻ biểu đồ tròn | Donut đường kính 180px, chú giải bên dưới donut (xếp 1 cột) |
| Thẻ biểu đồ cột | Cao 220px; chế độ Ngày vẫn cuộn ngang nếu thiếu chỗ (xem 10.6) |
| Danh sách giao dịch | Toàn chiều ngang; dòng cao ≥ 56px; tổng ròng ngày ở bên phải tiêu đề nhóm |
| FAB "+" | Tròn 56px, góc dưới phải, cách mép 24px (giống điện thoại) |

**(3) Màu & chữ** – Không đổi so với điện thoại: thẻ `--surface`, `--radius-lg`, `--shadow-1`; Tổng thu `--income`, Tổng chi `--expense`, Số dư `--text` (âm → `--expense`); tiêu đề khu vực H2, nhãn Caption, số tiền `tabular-nums`.

**(4) Hiển thị khi đổi kích thước**
- Từ **640px**: thẻ chuyển từ "1 thẻ lớn + 2 thẻ nhỏ" sang 3 thẻ bằng nhau; hai biểu đồ chuyển từ xếp dọc sang cạnh nhau (mỗi biểu đồ rộng 50%, khoảng cách 16px).
- Khi **xoay ngang** máy tính bảng (≥ 1024px) áp dụng bố cục laptop (4.3), FAB đổi thành nút "+ Thêm khoản" ở header.
- Không bao giờ có cuộn ngang ở cấp trang; chỉ biểu đồ cột chế độ Ngày được cuộn ngang bên trong thẻ.

---

### 11.2 Trang Nhập liệu trên máy tính bảng

**(1) Bố cục tổng thể** – Hộp thoại **giữa màn hình** (không dùng toàn màn hình như điện thoại), rộng 480px, cao tối đa `calc(100vh − 64px)`, nền phía sau mờ bằng overlay `rgba(10,14,22,.5)`. Khi bàn phím ảo bật và hộp thoại bị che, hộp thoại tự cuộn nội dung, thanh nút Lưu vẫn dính đáy hộp thoại.
```
        ┌─ Thêm khoản ───────── ✕ ┐
        │ [ Chi | Thu ]            │
        │ Số tiền        0 ₫       │
        │ Danh mục (lưới 4 cột)    │
        │ Ngày  [Hôm nay][Hôm qua] │
        │ Ghi chú                  │
        │ [ Hủy ]      [   Lưu   ] │
        └──────────────────────────┘
```

**(2) Thành phần** – Giống 6.6 và 10.7 (chế độ Sửa). Khác biệt duy nhất: chân hộp thoại có nút **Hủy** (Secondary) bên trái nút **Lưu / Lưu thay đổi** (Primary), cùng chiều cao 48px; ở chế độ Sửa nút **Xóa** (Danger viền) nằm sát mép trái.

**(3) Màu & chữ** – Modal `--surface`, `--radius-xl`, `--shadow-3`; ô Số tiền kiểu Display 32/40; nhãn Caption; lỗi `--danger`.

**(4) Hiển thị theo chiều** – Dọc (640–1023px): hộp thoại giữa như trên. Ngang và chiều cao < 500px: chuyển sang toàn màn hình giống điện thoại để không bị cắt. Esc đóng hộp thoại, Enter lưu (giống mục 6.9).

---

### 11.3 Trang chủ laptop – phương án danh sách "bên cạnh" (≥ 1280px)

Ở 1024–1279px giữ nguyên bố cục mục 4.3 (danh sách ở dưới). Từ **1280px** có thể dùng bố cục 2 cột để thấy danh sách mà không cần cuộn:

**(1) Bố cục tổng thể** – Khung tối đa 1120px (4.2), chia 2 cột 7 : 5.
```
┌──────────────────────────────────────────────────────────────┐
│ Sổ Thu Chi   ‹ Tháng 10/2026 ›   [⌕ Tìm…]  ⚙   [+ Thêm khoản]│
├──────────────────────────────────────┬───────────────────────┤
│ [Tổng thu] [Tổng chi] [Số dư]        │ Giao dịch  [⚲ Lọc]    │
│──────────────────────────────────────│ [Tất cả][Thu][Chi]    │
│ Chi tiêu theo     │ Thu vs Chi       │ HÔM NAY · 27/10       │
│ danh mục (donut)  │ (biểu đồ cột)    │ Ăn trưa     −55.000₫  │
│                   │                  │ ... (cuộn trong cột)  │
└──────────────────────────────────────┴───────────────────────┘
```

**(2) Thành phần** – Cột trái: ba thẻ số liệu + hai biểu đồ cạnh nhau. Cột phải: tiêu đề "Giao dịch", hàng chip lọc (10.5), danh sách nhóm theo ngày. Cột phải dính (sticky) dưới header, chiều cao `calc(100vh − 56px − 24px)` và **cuộn riêng**, không kéo theo cột trái.

**(3) Màu & chữ** – Cột phải là một thẻ `--surface`, `--radius-lg`, `--shadow-1`, padding 16px; đường kẻ dọc giữa hai cột không dùng, chỉ khoảng cách 24px.

**(4) Responsive** – Dưới 1280px tự đưa danh sách xuống dưới (4.3). Khi đang tìm kiếm (10.4) hoặc lọc, cột trái vẫn hiển thị để thấy tổng tháng, cột phải hiển thị kết quả.

---

### 11.4 Bảng tổng hợp hiển thị các panel mới theo thiết bị

Bổ sung cho 10.1 – 10.10 (vốn chỉ mô tả điện thoại và laptop). **Cột "Máy tính bảng" là phần mới.**

| Thành phần | Điện thoại (< 640px) | Máy tính bảng (640–1023px) | Laptop (≥ 1024px) |
|---|---|---|---|
| Cài đặt (10.2) | Bottom sheet 90% | **Panel trượt từ phải, rộng 360px** | Panel phải 400px |
| Xuất / Nhập (10.3) | Bottom sheet | **Modal giữa 480px, vùng kéo thả hiện nếu thiết bị có chuột/trackpad; thiết bị cảm ứng chỉ hiện nút Chọn tệp** | Modal 480px |
| Bộ lọc (10.5) | Bottom sheet | **Popover 320px neo dưới nút Lọc** | Popover 320px |
| Chọn tháng nhanh (10.8) | Bottom sheet thấp | **Popover 320px neo dưới tên tháng** | Popover 320px |
| Tìm kiếm (10.4) | Thanh trên đổi thành ô tìm | **Ô tìm kiếm rộng 200px trong header** (chạm vào mở rộng thành 320px) | Ô tìm kiếm 240px |
| Thẻ mời cài app (10.9) | Toàn dòng, 2 nút ngang | **Gọn trong 1 dòng, nút bên phải** | Gọn trong 1 dòng |
| Banner sao lưu / lỗi (10.10) | Nội dung + nút 2 hàng | **Nội dung + nút trên 1 hàng** | Nội dung + nút trên 1 hàng |
| Hộp thoại xác nhận (6.8, 10.10) | Rộng `calc(100% − 32px)` | Rộng 360px, căn giữa | Rộng 320–400px |

**Màu & chữ** – Mọi panel/popover dùng token đã khai báo ở 10.x (`--surface`, `--border`, `--shadow-2`/`--shadow-3`, `--radius-lg`/`--radius-xl`), không thêm token mới.

---

### 11.5 Bố cục các trạng thái rỗng, đang tải và lỗi (F-13)

Mục 9.2 – 9.4 đã có nội dung chữ; phần dưới đây bổ sung **bố cục** và thành phần.

#### 11.5.1 Lần đầu mở (chưa có dữ liệu)

**(1) Bố cục tổng thể** – Thay toàn bộ khu biểu đồ + danh sách bằng một khối căn giữa; ba thẻ tổng vẫn hiện `0 ₫` ở mờ 60%.
```
┌──────────────────────────┐
│  ‹  Tháng 10/2026  ›     │
│ [Tổng thu][Tổng chi][Dư] │ ← 0 ₫, mờ
│                          │
│        ┌──────┐          │
│        │ 📓   │          │ ← minh họa sổ trống (SVG)
│        └──────┘          │
│  Chưa có khoản nào       │
│  Ghi khoản đầu tiên      │
│  của bạn trong 15 giây   │
│     [ + Thêm khoản ]     │
│  Dữ liệu chỉ lưu trên    │
│  máy này, không cần       │
│  đăng nhập.              │
└──────────────────────────┘
```

**(2) Thành phần** – Minh họa SVG nét đơn giản 120px (tông `--text-muted`); tiêu đề H2; mô tả Body `--text-muted`, tối đa 280px; nút Primary "Thêm khoản" 48px; dòng nhỏ Caption về quyền riêng tư. Không hiện FAB khi trạng thái này đang hiện (tránh hai nút trùng chức năng).

**(3) Màu & chữ** – Nền `--bg`; không dùng `--income`/`--expense` trong minh họa; chữ như bảng mục 3.

**(4) Điện thoại / tablet / laptop** – Điện thoại: khối chiếm toàn chiều ngang, cách đỉnh 32px. Tablet và laptop: khối rộng tối đa 360px, căn giữa trong thẻ `--surface` bo `--radius-lg`.

#### 11.5.2 Tháng không có giao dịch / chỉ có thu

| Tình huống | Bố cục |
|---|---|
| Tháng không có giao dịch (đã có dữ liệu tháng khác) | Thẻ tổng `0 ₫` rõ nét; biểu đồ ẩn, thay bằng 1 thẻ cao 120px: icon `calendar-x` + "Chưa có giao dịch trong tháng này" + nút Secondary "Thêm khoản" và nút Ghost "Về tháng gần nhất có dữ liệu" |
| Chỉ có thu, chưa có chi | Thẻ biểu đồ tròn thu gọn còn cao 96px chứa icon `pie-chart` + "Chưa có chi tiêu trong tháng này"; thẻ biểu đồ cột và danh sách hiển thị bình thường |
| Lọc / tìm không có kết quả | Xem 10.4 và 10.5 |

#### 11.5.3 Đang tải (skeleton)

**(1) Bố cục tổng thể** – Giữ nguyên khung của Trang chủ để không bị nhảy bố cục khi dữ liệu hiện ra: 3 khối chữ nhật cho thẻ tổng, 1 vòng tròn xám cho donut, 1 khối cho biểu đồ cột, 6 dòng cho danh sách.

**(2) Thành phần** – Khối skeleton nền `--surface-2`, bo `--radius-md`; dòng danh sách gồm ô tròn 40px + 2 thanh chữ (rộng 60% và 30%) + 1 thanh số tiền (rộng 20%, căn phải).

**(3) Màu & chuyển động** – Hiệu ứng nhấp nháy: lớp sáng 10% quét ngang 1.2 giây lặp lại (theo `--ease-out`); với `prefers-reduced-motion` chỉ đổi độ mờ chậm 0.6 ↔ 1.0, không quét.

**(4) Quy tắc** – Chỉ hiện nếu tải > 200ms, hiện tối thiểu 300ms để tránh nhấp nháy; thêm `aria-busy="true"` cho vùng nội dung.

#### 11.5.4 Lỗi hệ thống (đặt vị trí)

Banner lỗi lưu trữ và hộp thoại dữ liệu hỏng đã mô tả ở 10.10. Bổ sung:

| Tình huống | Vị trí & hình thức |
|---|---|
| Lưu thất bại khi bấm Lưu | Form **không đóng**, dữ liệu đã nhập được giữ; thông báo lỗi đỏ ngay trên thanh nút Lưu (icon `alert-circle` + chữ `--danger`), nút "Thử lại" thay cho "Lưu" |
| Khôi phục (Hoàn tác) thất bại | Toast lỗi "Không thể hoàn tác" thay toast cũ, không có nút hành động |
| Trình duyệt không hỗ trợ lưu trữ | Trang toàn màn hình: icon `alert-octagon`, "Trình duyệt này không lưu được dữ liệu", hướng dẫn tắt chế độ riêng tư / dùng trình duyệt khác; ẩn nút Thêm |

---

### 11.6 Vị trí nút "+ Thêm" luôn hiển thị

Cụ thể hóa PRD 7.1 ("Nút '+ Thêm' luôn hiển thị") và 6.5.

| Tình huống | Hành vi |
|---|---|
| Điện thoại / tablet | FAB tròn 56px, cách mép phải 16px (tablet 24px), cách đáy `16px + env(safe-area-inset-bottom)` |
| Có toast đang hiện | Toast nằm **trên** FAB (cách 8px), không che FAB (z-index 40 > 20 nhưng xếp lệch vị trí) |
| Cuộn xuống nhanh | FAB vẫn hiển thị; không ẩn/hiện theo hướng cuộn |
| Mở panel, modal hoặc bottom sheet | FAB bị overlay che (z-index 20 < 30) và không nhận tương tác |
| Đang tìm kiếm trên điện thoại | FAB vẫn hiển thị; bấm sẽ mở Nhập liệu, sau khi lưu thì giữ nguyên từ khóa tìm |
| Trạng thái "Lần đầu mở" (11.5.1) | Ẩn FAB, dùng nút "Thêm khoản" trong khối rỗng |
| Laptop (≥ 1024px) | Không có FAB; nút Primary "+ Thêm khoản" cố định ở đầu header, phím tắt `N` |

---

### 11.7 Danh sách kiểm tra responsive (kiểm thử thủ công theo PRD §9)

| Chiều rộng thử | Điều cần kiểm tra |
|---|---|
| 360px | Một cột; không cuộn ngang; chữ số tiền không bị cắt (rút gọn `15,2 tr` nếu thiếu chỗ); FAB không che dòng cuối danh sách (chừa padding đáy 88px) |
| 640px | Thẻ chuyển sang 3 cột, biểu đồ chuyển sang 2 cột đúng ngưỡng |
| 768px | Các panel dùng bố cục tablet ở 11.4; hộp thoại Nhập liệu ở giữa (11.2) |
| 1024px | Có nút "+ Thêm khoản" ở header, không còn FAB; modal thay cho toàn màn hình |
| 1280px | Có thể chuyển sang bố cục 2 cột (11.3) |
| 1440px+ | Khung tối đa 1120px, căn giữa, không kéo giãn thêm |
| Dark mode | Mọi khối mới ở mục 11 chỉ dùng token, nên tự đổi theo `prefers-color-scheme` |
