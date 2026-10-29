# Sổ Thu Chi – Module M4: Tổng quan tháng (Trang chủ quản lý tổng thu chi)

Phạm vi theo PRD §4.1–4.2: **F-04 thẻ Tổng thu / Tổng chi / Số dư**, **F-08 chuyển tháng**, trạng thái rỗng/tải/lỗi của phần này,
và phát "tháng đang chọn" cho M5/M6. Giao diện theo DESIGN.md mục 2–6, 8, 9, 10.10, 11.1, 11.5. Không đụng M1/M2/M3/M5–M7.

## Logic chính: chi > thu thì cảnh báo
| Tình huống | Kết quả |
|---|---|
| Chi > Thu (kể cả hơn 1 ₫) | Banner "Chi đang vượt thu" (vạch trái `--warning`, `role="status"`) + thẻ "Chi vượt thu" ở Số dư; Số dư âm màu `--expense` có dấu − |
| Có chi nhưng chưa có khoản thu nào | Cảnh báo riêng: "Tháng này chưa có khoản thu nào nhưng đã chi …" |
| Chi = Thu | **Không** cảnh báo (chưa vượt) |
| Chi < Thu, chỉ có thu, tháng trống | Không cảnh báo |

Cảnh báo tính riêng cho từng tháng đang xem và tự bật/tắt khi nhận `sotc:data-changed`. Hàm: `OverviewModel.assess()`.

## Chạy thử
Mở `tong-quan.html` (không cần server). `?now=2026-10-29` giả lập "hôm nay". Khung dưới trang có nút thêm thu/chi mẫu để xem cảnh báo bật/tắt.
Dùng chung khóa localStorage `sotc.demo.v1` với bản giả lập của M3 nên dữ liệu nhập ở M3 (cùng nguồn gốc/origin) hiện ra ở đây.

## Cấu trúc
| Tệp | Vai trò |
|---|---|
| `js/overview-model.js` | Logic thuần: tháng, tổng hợp, `assess` (cảnh báo), định dạng tiền, tháng gần nhất có dữ liệu. Chạy được trong Node. |
| `js/overview-view.js` | Giao diện + trạng thái. API `SoThuChiOverview`. |
| `css/overview.css` | Style (tiền tố `ov-`), chỉ dùng token. |
| `css/tokens.css` | Token DESIGN.md – **thuộc M2**, chép vào để chạy độc lập. |
| `js/demo-store.js` | **Giả lập M1** (đọc localStorage). Thay bằng M1 thật. |
| `tests/unit`, `tests/e2e` | 33 test logic + 70 test trình duyệt thật. |

## Hợp đồng
- **Đọc dữ liệu (M1):** `SoThuChiOverview.mount(el, { store, now? , month? })`, `store.listByMonth('YYYY-MM')` → mảng giao dịch và `store.months()` → các tháng có dữ liệu (đồng bộ hoặc Promise).
- **Tháng đang chọn (M5/M6):** M4 là nguồn duy nhất. Sự kiện `sotc:month-changed` trên `document`, `detail = { ym, source:'overview' }` (bắn cả lúc khởi tạo). `getMonth()`, `setMonth(ym)`.
- **Làm mới:** tự tải lại khi nhận `sotc:data-changed` (M3 bắn).
- **Thêm khoản:** các nút "Thêm khoản" trong trạng thái rỗng có `data-action="add"` để M3 bắt.

## Quyết định cần biết
- **Lần đầu mở: thẻ 0 ₫ "mờ" bằng màu `--text-muted`**, không dùng opacity 60% như DESIGN 11.5.1, vì màu thu/chi ở 60% chỉ đạt ~2,5:1 (dưới ngưỡng AA 3:1).
- **Không lùi quá 01/2000** (cùng mốc ngày sớm nhất của M3); không tiến quá tháng hiện tại.
- Bản ghi hỏng (số tiền ≤ 0, không nguyên, loại lạ…) bị bỏ qua khi cộng, không làm sai tổng.
- Chưa làm (Could): bấm tên tháng để mở bộ chọn nhanh (DESIGN 10.8). Biểu đồ và danh sách thuộc M6/M5.
- Skeleton chỉ hiện nếu tải > 200ms và giữ tối thiểu 300ms; hoạt ảnh đếm số 400ms tắt khi người dùng bật giảm chuyển động.

## Chạy test
```
npm install        # axe-core + puppeteer-core (cần Chrome/Edge)
npm test           # unit + e2e
```
Nếu `npm install` không chạy được trên Google Drive: cài ở nơi khác và đặt `SOTC_TEST_DEPS` = thư mục chứa `node_modules`.
