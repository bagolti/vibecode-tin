/* achievements-page.js – Khởi động trang Thành tích. */
(function () {
  'use strict';
  var H = window.HongHa;
  var rootEl = document.getElementById('achievements-root');
  if (!H || !H.achievementsView || !rootEl) return;
  // Giữ tham chiếu để có thể dựng lại với dữ liệu khác (dùng trong kiểm thử)
  H.achievementsPage = H.achievementsView.mount(rootEl, H.achievementsData);
})();
