/*
 * achievements-data.js – Nội dung trang Thành tích (nhà trường chỉnh sửa tại đây).
 *
 * LƯU Ý: các số liệu/mốc dưới đây tổng hợp từ thpthongha.com để dựng giao diện.
 * Nhà trường PHẢI xác nhận hoặc thay bằng số liệu chính thức trước khi công bố (PRD, mục 8).
 *
 * Quy tắc:
 *  - stats:          { value:Số, label, prefix?, suffix?, animate?:false, plain?:true }  (tối đa 8)
 *                    plain:true = không chèn dấu chấm ngăn cách (dùng cho năm: "1997" thay vì "1.997")
 *  - timeline:       { year:Số nguyên, yearLabel?:"2019–2020", title, description? }  (mới nhất hiện trước)
 *  - certifications: { name, issuer?, icon?:"award|shield-check|leaf|medal|graduation-cap", image?:"đường dẫn ảnh giấy chứng nhận" }
 *  - testimonials:   { quote, name, role?, avatar?, consent:true }  – CHỈ hiện khi phụ huynh đã đồng ý (consent === true).
 *                    Để mảng rỗng cho tới khi có lời chia sẻ thật; không tự bịa nội dung.
 */
window.HongHa = window.HongHa || {};
window.HongHa.achievementsData = {
  intro:
    'Gần ba thập kỷ đồng hành cùng học sinh, Hồng Hà tự hào về kết quả học tập, những giải thưởng và các chứng nhận chất lượng mà thầy trò đã cùng nhau đạt được.',

  stats: [
    { value: 1997, label: 'Năm thành lập', prefix: 'Từ ', animate: false, plain: true },
    { value: 60000, label: 'Diện tích Nông trại Hồng Hà', suffix: '+ m²' },
    { value: 14, label: 'Trường đại học, cao đẳng đồng hành hướng nghiệp (3/2023)' },
    { value: 2, label: 'Huân chương Lao động hạng Ba' }
  ],

  timeline: [
    {
      year: 2025,
      yearLabel: '2024–2025',
      title: 'Học sinh đạt IELTS cao và học sinh giỏi cấp thành phố',
      description: 'Nhiều học sinh được ghi nhận với chứng chỉ IELTS điểm cao và danh hiệu học sinh giỏi cấp thành phố.'
    },
    {
      year: 2023,
      title: 'Ngày hội hướng nghiệp cùng 14 trường đại học, cao đẳng',
      description: 'Học sinh được gặp gỡ, tìm hiểu ngành nghề trực tiếp cùng đại diện các trường vào tháng 3/2023.'
    },
    {
      year: 2020,
      yearLabel: '2019–2020',
      title: 'Học sinh khối 12 đạt giải học sinh giỏi cấp thành phố',
      description: 'Ghi nhận thành tích của học sinh tại kỳ thi học sinh giỏi lớp 12 cấp thành phố.'
    },
    {
      year: 2020,
      yearLabel: '2019–2020',
      title: 'Đón nhận Huân chương Lao động hạng Ba',
      description: 'Ghi nhận quá trình xây dựng và phát triển của nhà trường.'
    },
    {
      year: 1997,
      title: 'Thành lập trường',
      description: 'Trường bắt đầu hoạt động với gần 100 học sinh.'
    }
  ],

  certifications: [
    { name: 'Tiêu chuẩn ISO', issuer: 'Hệ thống quản lý chất lượng', icon: 'shield-check' },
    { name: 'Nông trại hữu cơ đạt VietGAP', issuer: 'Nông trại Hồng Hà', icon: 'leaf' },
    { name: 'Huân chương Lao động hạng Ba', issuer: 'Nhà nước trao tặng', icon: 'medal' },
    { name: 'Học sinh giỏi cấp thành phố', issuer: 'Sở Giáo dục và Đào tạo', icon: 'graduation-cap' }
  ],

  testimonials: []
};
