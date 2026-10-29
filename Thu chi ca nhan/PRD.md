# PRD – Ứng dụng Ghi chép Thu/Chi Hằng ngày

> Phiên bản: 1.0 · Ngày: 2026-10-27 · Liên kết thiết kế: [DESIGN.md](DESIGN.md)

---

## 1. Tổng quan ứng dụng

**Tên tạm:** Sổ Thu Chi

Sổ Thu Chi là web app responsive giúp cá nhân ghi lại các khoản thu và chi hằng ngày, rồi xem tổng quan theo tháng bằng thẻ số liệu và biểu đồ. Ứng dụng chạy trên trình duyệt của điện thoại và laptop, không cần cài đặt hay đăng nhập. Toàn bộ dữ liệu lưu trên thiết bị của người dùng.

**Bối cảnh:** Nhiều người muốn biết tiền đi đâu mỗi tháng nhưng thấy các app quản lý tài chính quá phức tạp (đăng nhập, liên kết ngân hàng, nhiều tính năng thừa). Sổ Thu Chi chỉ làm một việc: nhập nhanh, nhìn rõ.

**Giả định đã chốt khi làm rõ yêu cầu:**

| Hạng mục | Quyết định |
|---|---|
| Nền tảng | Web app responsive (điện thoại + laptop) |
| Lưu trữ | Trên thiết bị (trình duyệt), không có tài khoản/backend |
| Thông tin mỗi khoản | Loại (thu/chi), số tiền, danh mục cố định, ngày, ghi chú |
| Trang chủ | Thẻ Tổng thu / Tổng chi / Số dư + biểu đồ tròn + biểu đồ cột, chuyển tháng |
| Tiền tệ | VND (₫), không quy đổi ngoại tệ *(giả định)* |
| Ngôn ngữ | Tiếng Việt *(giả định)* |

---

## 2. Mục tiêu ứng dụng

**Mục tiêu sản phẩm**
1. Giúp người dùng ghi một khoản thu/chi trong **dưới 15 giây**.
2. Giúp người dùng trả lời nhanh câu hỏi "Tháng này mình thu bao nhiêu, chi bao nhiêu, chi vào đâu?" chỉ bằng **một lần mở Trang chủ**.
3. Cho phép sửa/xóa khi nhập sai, không để dữ liệu sai làm lệch tổng quan.

**Mục tiêu người dùng:** Hình thành thói quen ghi chép hằng ngày và kiểm soát chi tiêu cá nhân.

**Mục tiêu kỹ thuật:** Ứng dụng gọn nhẹ, mở nhanh, dùng được khi không có mạng sau lần tải đầu, dữ liệu không rời khỏi thiết bị.

---

## 3. Đối tượng người dùng và User Stories

### 3.1 Đối tượng

**Người dùng chính:** Cá nhân tự quản lý tài chính của mình (sinh viên, nhân viên văn phòng, người đi làm tự do), 18–45 tuổi.

| Đặc điểm | Mô tả |
|---|---|
| Thiết bị | Chủ yếu điện thoại (nhập nhanh khi vừa tiêu tiền); thỉnh thoảng laptop (xem lại, rà soát) |
| Trình độ | Không chuyên về kế toán, muốn công cụ đơn giản |
| Nhu cầu | Ghi nhanh, xem tổng kết tháng, không muốn tạo tài khoản |
| Nỗi đau | App phức tạp, quảng cáo, đòi quyền truy cập, bỏ dở sau vài ngày |

### 3.2 User Stories

| ID | Là một… | Tôi muốn… | Để… | Ưu tiên |
|---|---|---|---|---|
| US-01 | người dùng | thêm một khoản chi (số tiền, danh mục, ngày, ghi chú) | lưu lại việc đã tiêu tiền | Must |
| US-02 | người dùng | thêm một khoản thu | ghi nhận lương và các nguồn thu khác | Must |
| US-03 | người dùng | xem danh sách các khoản trong tháng, nhóm theo ngày | rà soát lại mình đã ghi gì | Must |
| US-04 | người dùng | xem tổng thu, tổng chi và số dư của tháng | biết tình hình tài chính ngay lập tức | Must |
| US-05 | người dùng | xem biểu đồ tròn chi tiêu theo danh mục | biết tiền chi nhiều nhất vào đâu | Must |
| US-06 | người dùng | xem biểu đồ cột thu vs chi theo ngày/tuần | thấy nhịp chi tiêu trong tháng | Should |
| US-07 | người dùng | sửa một khoản đã ghi | chỉnh lại khi nhập nhầm | Must |
| US-08 | người dùng | xóa một khoản (có xác nhận, có hoàn tác) | bỏ khoản ghi sai hoặc trùng | Must |
| US-09 | người dùng | chuyển sang tháng trước/sau | so sánh và xem lại lịch sử | Must |
| US-10 | người dùng | lọc danh sách theo Thu/Chi hoặc danh mục | tìm khoản cụ thể | Should |
| US-11 | người dùng | dùng app mượt trên cả điện thoại và laptop | nhập ở đâu cũng tiện | Must |
| US-12 | người dùng | xuất dữ liệu ra file để sao lưu | không mất dữ liệu khi đổi máy | Could |

---

## 4. Danh sách chức năng chính

| # | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| F-01 | Thêm khoản thu/chi | Form: loại (Thu/Chi), số tiền, danh mục, ngày (mặc định hôm nay), ghi chú (tùy chọn). Validate số tiền > 0 | **Must** |
| F-02 | Danh mục cố định | Danh sách có sẵn. Chi: Ăn uống, Di chuyển, Nhà ở, Mua sắm, Giải trí, Sức khỏe, Học tập, Khác. Thu: Lương, Thưởng, Thu nhập phụ, Khác | **Must** |
| F-03 | Danh sách giao dịch | Hiển thị các khoản của tháng đang chọn, nhóm theo ngày, mới nhất trước; mỗi dòng có biểu tượng danh mục, ghi chú, số tiền (màu theo thu/chi) | **Must** |
| F-04 | Thẻ tổng quan tháng | Tổng thu, Tổng chi, Số dư (= thu − chi) của tháng đang chọn | **Must** |
| F-05 | Biểu đồ tròn | Cơ cấu chi tiêu theo danh mục trong tháng, kèm số tiền và % | **Must** |
| F-06 | Sửa giao dịch | Mở lại form với dữ liệu cũ, lưu thay đổi | **Must** |
| F-07 | Xóa giao dịch | Xác nhận trước khi xóa; sau khi xóa hiện thông báo "Hoàn tác" vài giây | **Must** |
| F-08 | Chuyển tháng | Nút tháng trước/sau; mặc định là tháng hiện tại | **Must** |
| F-09 | Lưu trên thiết bị | Dữ liệu lưu trong trình duyệt, còn nguyên khi tắt/mở lại | **Must** |
| F-10 | Giao diện responsive | Bố cục thích ứng điện thoại, máy tính bảng, laptop | **Must** |
| F-11 | Biểu đồ cột thu vs chi | Cột thu/chi theo ngày hoặc tuần trong tháng | **Should** |
| F-12 | Lọc danh sách | Lọc theo Thu/Chi và theo danh mục | **Should** |
| F-13 | Trạng thái rỗng, lỗi, tải | Hướng dẫn khi chưa có dữ liệu; báo lỗi form rõ ràng | **Should** |
| F-14 | Chế độ tối | Theo cài đặt hệ thống | **Should** |
| F-15 | Xuất/nhập CSV hoặc JSON | Sao lưu và chuyển dữ liệu giữa thiết bị | **Could** |
| F-16 | Tìm kiếm theo ghi chú | Ô tìm kiếm trong danh sách | **Could** |
| F-17 | Cài như app (PWA) | Thêm vào màn hình chính, chạy offline | **Could** |

### 4.1 Phân chia module

Ứng dụng chia thành **7 module** độc lập, mỗi module có phạm vi, đầu vào/đầu ra rõ ràng để xây và kiểm thử riêng. Mỗi chức năng F-01…F-17 thuộc đúng **một** module chính.

| Module | Tên | Chức năng (mục 4) | Ưu tiên | Phụ thuộc |
|---|---|---|---|---|
| **M1** | Lõi dữ liệu & lưu trữ | F-02 Danh mục cố định, F-09 Lưu trên thiết bị, phần *lỗi lưu trữ* của F-13 | Must | – |
| **M2** | Khung giao diện & chủ đề | F-10 Responsive, F-14 Chế độ tối, phần *trạng thái rỗng/tải* của F-13 | Must | – |
| **M3** | Nhập liệu thu chi | F-01 Thêm, F-06 Sửa, F-07 Xóa + Hoàn tác, phần *báo lỗi form* của F-13 | Must | M1, M2 |
| **M4** | Tổng quan tháng | F-08 Chuyển tháng, F-04 Thẻ Tổng thu/Tổng chi/Số dư | Must | M1, M2 |
| **M5** | Danh sách giao dịch | F-03 Danh sách nhóm theo ngày, F-12 Lọc, F-16 Tìm kiếm theo ghi chú | Must (F-03), Should/Could (F-12, F-16) | M1, M2, M4 (tháng đang chọn) |
| **M6** | Biểu đồ | F-05 Biểu đồ tròn, F-11 Biểu đồ cột thu vs chi | Must (F-05), Should (F-11) | M1, M2, M4 |
| **M7** | Sao lưu & cài đặt ứng dụng | F-15 Xuất/nhập CSV/JSON, F-17 PWA/offline | Could | M1, M2 |

**Phạm vi từng module**

| Module | Làm | Không làm (thuộc module khác) |
|---|---|---|
| M1 | Mô hình `Transaction`, `schemaVersion`, 12 danh mục cố định, đọc/ghi `localStorage`/IndexedDB, thêm/sửa/xóa/khôi phục ở tầng dữ liệu, bắt lỗi storage đầy/bị chặn/dữ liệu hỏng, truy vấn theo tháng | Mọi giao diện |
| M2 | Token màu/chữ/khoảng cách, bố cục 3 điểm ngắt, header, nút "+ Thêm"/FAB, chế độ tối, skeleton/trạng thái rỗng dùng chung, toast, hộp thoại | Nội dung các màn hình |
| M3 | Màn Nhập liệu (Thêm/Sửa), kiểm tra hợp lệ, định dạng số tiền, hộp thoại xác nhận xóa, toast "Hoàn tác" | Lưu trữ (dùng M1), danh sách (M5) |
| M4 | Bộ chọn tháng ‹ ›, ba thẻ số liệu, trạng thái "tháng không có giao dịch", phát tháng đang chọn cho M5/M6 | Biểu đồ, danh sách |
| M5 | Danh sách theo ngày, tổng ròng từng ngày, chip lọc, ô tìm kiếm, mở form Sửa khi bấm dòng | Form sửa (M3), tính tổng tháng (M4) |
| M6 | Biểu đồ donut + chú giải + bảng thay thế, biểu đồ cột Thu/Chi theo tuần/ngày | Thẻ tổng (M4) |
| M7 | Xuất JSON/CSV, nhập (gộp/thay thế), nhắc sao lưu, manifest + service worker | Lõi dữ liệu (dùng M1) |

**Thứ tự xây đề xuất:** M1 → M2 → M3 → M4 → M5 → M6 → M7. Sau M3 đã dùng được app ở mức nhập và lưu; sau M5 đã đủ luồng **Must** cốt lõi (US-01…04, 07…09); M6 hoàn tất mục tiêu "một lần mở Trang chủ"; M7 là bản nâng cấp **Could**.

**Ánh xạ module ↔ màn hình (mục 7):** Trang chủ = M4 + M6 + M5; Trang Nhập liệu = M3; M1, M2, M7 là nền tảng/tiện ích không có màn riêng (M7 có panel Cài đặt).

### 4.2 Chi tiết từng module: đầu vào, đầu ra, tiêu chí hoàn thành

Bổ sung cho 4.1 để mỗi module có thể được xây và kiểm thử **độc lập**. Cách chia 7 module ở 4.1 giữ nguyên.

| Module | Đầu vào | Đầu ra (giao cho module khác) | Tiêu chí hoàn thành (DoD) | Cách kiểm thử riêng |
|---|---|---|---|---|
| **M1** Lõi dữ liệu & lưu trữ | Lệnh thêm/sửa/xóa/khôi phục `Transaction`; yêu cầu truy vấn theo tháng (`YYYY-MM`) | Danh sách `Transaction` của tháng; danh sách 12 danh mục cố định; mã lỗi lưu trữ (đầy, bị chặn, dữ liệu hỏng) | Dữ liệu còn nguyên sau khi đóng/mở trình duyệt; số tiền luôn là số nguyên VND; có `schemaVersion`; bắt được 3 loại lỗi storage; truy vấn đúng với ≥ 5.000 giao dịch | Test hàm thuần (không cần giao diện) trên bộ dữ liệu mẫu; giả lập storage đầy/bị chặn/JSON hỏng |
| **M2** Khung giao diện & chủ đề | Token thiết kế trong DESIGN.md; trạng thái sáng/tối | Khung trang, header, nút "+ Thêm"/FAB, toast, hộp thoại, skeleton, trạng thái rỗng dùng chung | Không cuộn ngang ở 360 / 768 / 1280px; chế độ tối đúng theo hệ thống; tương phản ≥ 4.5:1 | Kiểm tra 3 độ rộng + bật/tắt dark mode; Lighthouse Accessibility ≥ 90 |
| **M3** Nhập liệu thu chi | Thao tác người dùng (loại, số tiền, danh mục, ngày, ghi chú); giao dịch cần sửa/xóa | Lệnh Thêm/Sửa/Xóa/Hoàn tác gửi M1; sự kiện "đã thay đổi dữ liệu" để M4–M6 làm mới | Thêm 1 khoản ≤ 15 giây; chặn số tiền ≤ 0, thiếu danh mục, ngày sai, ghi chú > 120 ký tự; xóa có xác nhận và Hoàn tác trong 5 giây | Test từng quy tắc hợp lệ; bấm giờ luồng thêm; thử sửa/xóa/hoàn tác rồi đối chiếu dữ liệu ở M1 |
| **M4** Tổng quan tháng | Tháng đang chọn; danh sách giao dịch của tháng (từ M1) | Tổng thu, Tổng chi, Số dư; **tháng đang chọn** phát cho M5 và M6 | Số dư = thu − chi, khớp 100% với tính tay; `›` bị vô hiệu ở tháng hiện tại; tháng trống hiện `0 ₫` | So với bộ dữ liệu mẫu có đáp án tính tay; thử chuyển tháng qua ranh giới năm (12/2026 → 01/2027) |
| **M5** Danh sách giao dịch | Tháng đang chọn (từ M4); bộ lọc; từ khóa | Danh sách nhóm theo ngày, tổng ròng từng ngày; yêu cầu mở form Sửa gửi M3 | Mới nhất trước; lọc theo Thu/Chi và danh mục đúng; tìm theo ghi chú không phân biệt hoa/thường và dấu; dùng mượt với ≥ 5.000 giao dịch | Test lọc/tìm trên dữ liệu mẫu; đo thời gian hiển thị với 5.000 giao dịch |
| **M6** Biểu đồ | Tháng đang chọn (từ M4); giao dịch của tháng | Biểu đồ donut + chú giải; biểu đồ cột Thu/Chi theo tuần/ngày; bảng số liệu thay thế | Tổng các phần trong donut = Tổng chi; danh mục < 3% gộp vào "Khác"; mỗi biểu đồ có bảng thay thế; số liệu khớp M4 | So tổng biểu đồ với M4; thử tháng chỉ có thu / không có dữ liệu |
| **M7** Sao lưu & cài đặt ứng dụng | Toàn bộ dữ liệu (từ M1); tệp JSON/CSV do người dùng chọn | Tệp xuất `so-thu-chi_YYYY-MM-DD.json/.csv`; dữ liệu nhập vào M1 (gộp hoặc thay thế); manifest + service worker | Xuất rồi nhập lại cho kết quả giống hệt; tệp sai định dạng bị từ chối với thông báo rõ; mở lại được khi offline | Xuất → xóa dữ liệu → nhập lại → đối chiếu; thử tệp hỏng; bật chế độ máy bay |

**Hợp đồng giữa các module (tránh phụ thuộc chéo):**
1. Chỉ **M1** được đọc/ghi bộ nhớ trình duyệt; các module khác gọi qua M1.
2. **M4** là nguồn duy nhất của "tháng đang chọn"; M5 và M6 chỉ nhận, không tự giữ tháng riêng.
3. **M3** không tự cập nhật màn hình khác; chỉ báo "dữ liệu đã đổi" để M4–M6 tự làm mới.
4. **M2** không chứa nghiệp vụ; mọi màu, khoảng cách lấy từ token trong DESIGN.md.

**Mốc kiểm tra sau mỗi bước (theo thứ tự xây ở 4.1):** sau M1 chạy được test dữ liệu; sau M3 dùng được ở mức nhập và lưu; sau M5 đủ luồng Must cốt lõi; sau M6 đạt mục tiêu "một lần mở Trang chủ"; sau M7 hoàn tất bản Could.

---

## 5. Non-Goals – Không làm ở phiên bản này

- ❌ Tài khoản, đăng nhập, đồng bộ cloud giữa nhiều thiết bị.
- ❌ Liên kết ngân hàng, ví điện tử, tự động đọc SMS/thông báo giao dịch.
- ❌ Ngân sách (budget), mục tiêu tiết kiệm, nhắc nhở/thông báo đẩy.
- ❌ Nhiều ví/tài khoản, chuyển khoản giữa các ví.
- ❌ Danh mục tự tạo/sửa/xóa (dùng danh mục cố định).
- ❌ Đa tiền tệ, quy đổi tỷ giá; đa ngôn ngữ.
- ❌ Chia sẻ chi tiêu nhóm, hóa đơn chung.
- ❌ Đính kèm ảnh hóa đơn, quét OCR.
- ❌ Giao dịch định kỳ tự động (tiền nhà, subscription).
- ❌ App native iOS/Android.
- ❌ Báo cáo năm, dự báo, phân tích nâng cao.

---

## 6. Luồng sử dụng chính

### 6.1 Thêm một khoản chi (luồng quan trọng nhất)
1. Người dùng mở app → vào **Trang chủ**, thấy tổng quan tháng hiện tại.
2. Bấm nút **"+ Thêm"** (nút nổi trên điện thoại / nút trên thanh bên laptop).
3. Màn **Nhập liệu** mở ra, mặc định loại **Chi**, ngày **hôm nay**.
4. Nhập **số tiền** (bàn phím số tự bật trên điện thoại).
5. Chọn **danh mục** (lưới biểu tượng).
6. (Tùy chọn) Đổi ngày, nhập ghi chú.
7. Bấm **"Lưu"** → app kiểm tra hợp lệ.
8. Quay về Trang chủ, thẻ tổng, biểu đồ và danh sách cập nhật; hiện thông báo "Đã lưu".

### 6.2 Thêm một khoản thu
Như 6.1, nhưng ở bước 3 người dùng chuyển công tắc sang **Thu**; danh sách danh mục đổi theo (Lương, Thưởng…).

### 6.3 Xem tổng quan theo tháng
1. Ở Trang chủ, đọc ba thẻ **Tổng thu / Tổng chi / Số dư**.
2. Xem **biểu đồ tròn** chi tiêu theo danh mục; (Should) xem **biểu đồ cột** thu vs chi.
3. Bấm **‹ ›** cạnh tên tháng để xem tháng khác; mọi số liệu và biểu đồ cập nhật theo.
4. Cuộn xuống xem **danh sách giao dịch** của tháng, nhóm theo ngày.

### 6.4 Sửa một khoản
1. Ở danh sách, bấm vào một dòng giao dịch.
2. Màn Nhập liệu mở ở chế độ **Sửa** với dữ liệu sẵn có.
3. Chỉnh sửa → bấm **"Lưu thay đổi"** → về Trang chủ với số liệu đã cập nhật.

### 6.5 Xóa một khoản
1. Mở giao dịch ở chế độ Sửa → bấm **"Xóa"** (hoặc vuốt/menu trên dòng).
2. Hộp thoại xác nhận: "Xóa khoản này?" → **Xóa** / **Hủy**.
3. Sau khi xóa, hiện toast **"Đã xóa · Hoàn tác"** trong ~5 giây.

---

## 7. Giao diện dự kiến

Chi tiết hình thức xem [DESIGN.md](DESIGN.md). Ứng dụng có **hai màn hình chính**:

### 7.1 Trang chủ (Tổng quan + Danh sách)
- **Đầu trang:** bộ chọn tháng `‹ Tháng 10/2026 ›`.
- **Ba thẻ số liệu:** Tổng thu (xanh), Tổng chi (đỏ), Số dư (trung tính/nhấn).
- **Biểu đồ tròn** chi tiêu theo danh mục + chú giải.
- **Biểu đồ cột** thu vs chi (Should).
- **Danh sách giao dịch** nhóm theo ngày (bộ lọc ở Should); bấm một dòng để sửa.
- **Nút "+ Thêm"** luôn hiển thị.

### 7.2 Trang Nhập liệu (Thêm / Sửa)
- Công tắc **Chi | Thu**.
- Ô **Số tiền** lớn, tự định dạng ngăn cách hàng nghìn.
- Lưới **Danh mục**.
- Ô **Ngày** (mặc định hôm nay) và **Ghi chú**.
- Nút **Lưu**; ở chế độ Sửa có thêm **Xóa**.

### 7.3 Bố cục theo thiết bị
| Thiết bị | Trang chủ | Nhập liệu |
|---|---|---|
| Điện thoại (< 640px) | Một cột, nút "+" nổi góc dưới phải | Toàn màn hình |
| Máy tính bảng (640–1023px) | Thẻ tổng 3 cột, biểu đồ 2 cột | Toàn màn hình hoặc hộp thoại giữa |
| Laptop (≥ 1024px) | Thẻ và biểu đồ ở trên, danh sách bên dưới/bên cạnh | Hộp thoại (modal) hoặc panel bên phải |

---

## 8. Ràng buộc kỹ thuật

| Hạng mục | Ràng buộc |
|---|---|
| Loại ứng dụng | Web app tĩnh (HTML/CSS/JS), không backend |
| Công nghệ gợi ý | HTML + CSS + JavaScript thuần hoặc framework nhẹ; thư viện biểu đồ nhẹ (Chart.js) hoặc SVG tự vẽ |
| Lưu trữ | `localStorage` hoặc IndexedDB; khóa dữ liệu có phiên bản (`schemaVersion`) để nâng cấp sau |
| Mô hình dữ liệu | `Transaction { id, type: 'income'\|'expense', amount: integer (VND), category, date: 'YYYY-MM-DD', note, createdAt, updatedAt }` |
| Tiền tệ | Lưu số nguyên VND, hiển thị `1.250.000 ₫` (định dạng `vi-VN`) |
| Múi giờ/ngày | Ngày theo giờ địa phương, không dùng UTC để tránh lệch ngày |
| Trình duyệt | Chrome, Safari, Edge, Firefox bản mới (2 phiên bản gần nhất), iOS Safari 15+ |
| Responsive | Mobile-first, hỗ trợ từ 360px đến 1440px+ |
| Hiệu năng | Tải lần đầu < 2 giây trên 4G; dùng mượt với ≥ 5.000 giao dịch |
| Dung lượng | Tổng gói < 500 KB (không tính font) |
| Khả năng truy cập | Tuân thủ WCAG 2.1 AA: tương phản ≥ 4.5:1, điều khiển bằng bàn phím, nhãn cho biểu đồ (bảng số liệu thay thế) |
| Quyền riêng tư | Dữ liệu không gửi ra ngoài; không tracker, không quảng cáo |
| Rủi ro dữ liệu | Xóa dữ liệu trình duyệt sẽ mất sổ → cần cảnh báo, và F-15 (xuất file) là bước giảm thiểu |
| Xử lý lỗi | Bắt lỗi khi storage đầy/bị chặn (chế độ riêng tư) và báo người dùng |

---

## 9. Tiêu chí thành công (Success Metrics)

Vì app không có backend/tracking, các chỉ số được đo bằng **kiểm thử thủ công** và **thử nghiệm với người dùng thật** (5–10 người).

| Chỉ số | Mục tiêu | Cách đo |
|---|---|---|
| Thời gian thêm 1 khoản | ≤ 15 giây (người dùng mới ≤ 30 giây) | Bấm giờ khi thử nghiệm |
| Tỷ lệ hoàn thành lần đầu | ≥ 90% người thử thêm được khoản đầu tiên không cần hướng dẫn | Quan sát |
| Đọc hiểu tổng quan | ≥ 90% trả lời đúng "tháng này chi bao nhiêu / chi nhiều nhất vào đâu" trong ≤ 10 giây | Hỏi người thử |
| Độ chính xác số liệu | 100% tổng thu/chi/số dư khớp tính tay trên bộ dữ liệu mẫu | Test dữ liệu mẫu |
| Sửa/xóa | 100% thao tác sửa/xóa cập nhật đúng tổng quan và biểu đồ | Test chức năng |
| Giữ dữ liệu | 0 mất mát dữ liệu sau khi đóng/mở lại trình duyệt | Test chức năng |
| Hiệu năng | Lighthouse Performance ≥ 90 trên mobile | Lighthouse |
| Khả năng truy cập | Lighthouse Accessibility ≥ 90 | Lighthouse |
| Responsive | Không lỗi bố cục/cuộn ngang ở 360px, 768px, 1280px | Kiểm tra thủ công |
| Mức độ hài lòng | ≥ 4/5 điểm (đơn giản, dễ dùng) | Khảo sát nhanh sau thử nghiệm |
| Thói quen (sau 2 tuần dùng thử) | ≥ 60% người thử ghi ≥ 5 ngày/tuần | Hỏi lại người thử |
