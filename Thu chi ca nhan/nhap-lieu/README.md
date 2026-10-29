# Sổ Thu Chi – Module M3: Nhập liệu thu chi

Phạm vi theo PRD §4.1–4.2: **F-01 Thêm, F-06 Sửa, F-07 Xóa + Hoàn tác**, phần *báo lỗi form* của F-13.
Giao diện theo DESIGN.md mục 2–6, 8, 9, 10.7. Không đụng tới M1/M2/M4–M7.

## Chạy thử
Mở `nhap-lieu.html` bằng trình duyệt (không cần server). Trang này chỉ là **khung thử nghiệm**: nút "+ Thêm khoản"/FAB và một danh sách thô có nút "Sửa" để kiểm tra dữ liệu (thuộc M5, sẽ bị thay).

## Cấu trúc
| Tệp | Vai trò |
|---|---|
| `js/entry-model.js` | Logic thuần: danh mục, định dạng/phân tích số tiền, kiểm tra hợp lệ, đổi loại, phát hiện thay đổi chưa lưu. Chạy được trong Node. |
| `js/entry-view.js` | Giao diện + luồng Thêm/Sửa/Xóa/Hoàn tác, hộp thoại xác nhận, toast, focus trap. API `SoThuChiEntry`. |
| `css/entry.css` | Style của module (tiền tố `en-`), chỉ dùng token. |
| `css/tokens.css` | Token DESIGN.md. **Thuộc M2**, chép vào để chạy độc lập; thay bằng token M2 (cùng tên biến). |
| `js/demo-store.js` | **Giả lập M1** (localStorage) để chạy/test độc lập; thay bằng M1 thật. |
| `tests/unit`, `tests/e2e` | 59 test logic + 97 test trình duyệt thật. |

## Hợp đồng với module khác
**Dữ liệu (M1):** `SoThuChiEntry.configure({ store })`; `store` có 5 hàm (đồng bộ hoặc trả Promise):

| Hàm | Trả về |
|---|---|
| `add({type, amount, category, date, note})` | `{ok:true, tx}` — M1 cấp `id`, `createdAt`, `updatedAt` |
| `update(id, {type, amount, category, date, note})` | `{ok:true, tx}` |
| `remove(id)` | `{ok:true, tx}` — `tx` là bản ghi vừa xóa |
| `restore(tx)` | `{ok:true, tx}` — khôi phục y nguyên (cùng `id`, `createdAt`) |
| `get(id)` | `tx` hoặc `null` |

Lỗi: `{ok:false, error}` với `error` ∈ `full` · `blocked` · `corrupt` · `notfound` · khác. Hàm ném lỗi cũng được xử lý như lỗi lưu.

**Báo thay đổi (M4–M6):** mỗi lần ghi thành công, `document` nhận `sotc:data-changed` với `detail = { source:'entry', action:'add'|'update'|'delete'|'restore', id, tx }`. M3 không tự cập nhật màn hình khác.

**Điểm vào (M2/M5):** bấm phần tử `[data-action="add"]` hoặc `[data-action="edit"][data-id="…"]`, hoặc gọi `SoThuChiEntry.open({mode:'add'})` / `open({mode:'edit', id})`.

## Quy tắc đã cài (PRD F-01, DESIGN 9.3)
- Số tiền: số nguyên > 0, tối đa 12 chữ số (999.999.999.999 ₫); tự thêm dấu chấm, giữ vị trí con trỏ; dán "1.250.000đ" được làm sạch.
- Danh mục bắt buộc và phải thuộc đúng loại (Chi 8 · Thu 4). Đổi Chi↔Thu bỏ chọn danh mục không còn hợp lệ và gợi ý "Chọn lại danh mục".
- Ngày: có thật trong lịch, giờ địa phương, từ 01/01/2000 đến **hôm nay**.
- Ghi chú: ≤ 120 ký tự (đếm theo ký tự thật, emoji = 1), tối đa 2 dòng, cắt khoảng trắng hai đầu.
- Lỗi hiện khi rời ô hoặc bấm Lưu; focus nhảy tới ô lỗi đầu tiên; ô rung nhẹ.
- Sửa: "Lưu thay đổi" chỉ bật khi có thay đổi; có dòng "Tạo … · Sửa lần cuối …".
- Xóa: xác nhận → toast "Đã xóa · Hoàn tác" 5 giây. Đóng form khi có thay đổi → "Bỏ thay đổi?".
- Storage lỗi: banner trong form, **không mất dữ liệu đã nhập**, nút Lưu dùng lại được. Chống bấm Lưu đôi.

## Quyết định cần biết
- **Không cho nhập ngày tương lai.** M4 vô hiệu nút `›` ở tháng hiện tại, nên khoản có ngày tương lai sẽ không bao giờ xem được. Nếu muốn cho phép, đổi `todayStr` trong `validate()` và thuộc tính `max` của ô ngày.
- **Enter = Lưu** ở mọi ô (kể cả ô danh mục/Chi-Thu; Space mới là chọn). Trong ghi chú, Shift+Enter xuống dòng.
- **Nhãn Chi/Thu cỡ 20px đậm** (chữ lớn, ngưỡng 3:1): cặp màu `--expense` trên `--expense-soft` trong DESIGN chỉ đạt 4,26:1, không đủ 4,5:1 cho chữ 16px.
- Chỉ có một toast tại một thời điểm: xóa khoản A rồi thao tác khác trong 5 giây sẽ làm mất Hoàn tác của A.
- Hộp thoại xác nhận và toast nằm trong M3 vì M2 chưa xây; khi có M2 có thể chuyển sang dùng chung.
- Chưa làm: vuốt dòng để Sửa/Xóa và menu trên dòng (thuộc M5, DESIGN 10.7).

## Chạy test
```
npm install            # axe-core + puppeteer-core (cần Chrome hoặc Edge có sẵn trên máy)
npm test               # unit + e2e
npm run test:unit      # chỉ logic, không cần trình duyệt
```
Nếu `npm install` không chạy được trên ổ Google Drive: cài ở thư mục khác rồi đặt `SOTC_TEST_DEPS` = thư mục chứa `node_modules` đó (và `CHROME_PATH` nếu cần).
