'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../../js/entry-model.js');

const NOW = new Date(2026, 9, 27, 12, 0, 0); // 27/10/2026 giờ địa phương
const good = (o) => Object.assign({ type: 'expense', amount: '55.000', category: 'an-uong', date: '2026-10-27', note: 'Ăn trưa' }, o);

test.describe('Danh mục cố định (F-02)', () => {
  test('Chi có đúng 8 danh mục, Thu có đúng 4, đúng thứ tự PRD', () => {
    assert.deepEqual(M.CATEGORIES.expense.map((c) => c.name),
      ['Ăn uống', 'Di chuyển', 'Nhà ở', 'Mua sắm', 'Giải trí', 'Sức khỏe', 'Học tập', 'Khác']);
    assert.deepEqual(M.CATEGORIES.income.map((c) => c.name), ['Lương', 'Thưởng', 'Thu nhập phụ', 'Khác']);
  });
  test('id duy nhất, mỗi danh mục có icon và chỉ số màu 1–8', () => {
    const all = [...M.CATEGORIES.expense, ...M.CATEGORIES.income];
    assert.equal(new Set(all.map((c) => c.id)).size, 12);
    for (const c of all) { assert.ok(c.icon); assert.ok(c.c >= 1 && c.c <= 8); }
  });
  test('categoryBelongsTo phân biệt loại; id lạ bị từ chối', () => {
    assert.ok(M.categoryBelongsTo('an-uong', 'expense'));
    assert.ok(!M.categoryBelongsTo('an-uong', 'income'));
    assert.ok(M.categoryBelongsTo('luong', 'income'));
    assert.ok(!M.categoryBelongsTo('khong-co', 'expense'));
    assert.ok(!M.categoryBelongsTo('', 'expense'));
    assert.ok(!M.categoryBelongsTo(undefined, 'expense'));
  });
  test('categoriesFor trả danh sách theo loại, loại lạ rơi về Chi', () => {
    assert.equal(M.categoriesFor('income').length, 4);
    assert.equal(M.categoriesFor('expense').length, 8);
    assert.equal(M.categoriesFor('xyz').length, 8);
  });
});

test.describe('Số tiền: định dạng & phân tích', () => {
  const cases = [
    ['', ''], ['0', '0'], ['5', '5'], ['55000', '55.000'], ['1250000', '1.250.000'], ['1.250.000', '1.250.000'],
    ['007', '7'], ['000', '0'], ['abc', ''], ['1a2b3', '123'], ['-5', '5'], ['1,5', '15'], [' 12 345 ', '12.345'],
    ['1.250.000 ₫', '1.250.000'], ['999999999999', '999.999.999.999'], ['9999999999999', '999.999.999.999']
  ];
  for (const [raw, out] of cases) {
    test(`formatAmountInput(${JSON.stringify(raw)}) = ${JSON.stringify(out)}`, () => assert.equal(M.formatAmountInput(raw), out));
  }
  test('parseAmount trả số nguyên; rỗng/không hợp lệ = 0', () => {
    assert.equal(M.parseAmount('1.250.000'), 1250000);
    assert.equal(M.parseAmount(''), 0);
    assert.equal(M.parseAmount('abc'), 0);
    assert.equal(M.parseAmount(null), 0);
    assert.equal(M.parseAmount(undefined), 0);
    assert.equal(M.parseAmount('0'), 0);
    assert.ok(Number.isInteger(M.parseAmount('123.456')));
    assert.equal(M.parseAmount('999.999.999.999'), M.AMOUNT_MAX);
  });
  test('formatVnd / formatSigned theo vi-VN, dấu − (U+2212) cho chi, + cho thu', () => {
    assert.equal(M.formatVnd(1250000), '1.250.000 ₫');
    assert.equal(M.formatVnd(0), '0 ₫');
    assert.equal(M.formatVnd(999), '999 ₫');
    assert.equal(M.formatVnd(1000), '1.000 ₫');
    assert.equal(M.formatSigned(55000, 'expense'), '−55.000 ₫');
    assert.equal(M.formatSigned(15000000, 'income'), '+15.000.000 ₫');
  });
  test('caretAfterFormat giữ nguyên số chữ số trước con trỏ', () => {
    // gõ thêm chữ số thứ 4 vào "123" -> "1.234", con trỏ ở cuối
    assert.equal(M.caretAfterFormat('1234', 4, '1.234'), 5);
    // chèn giữa: "1.2|34" (caret 4) sau khi xóa dấu chấm -> vẫn sau chữ số thứ 2
    assert.equal(M.caretAfterFormat('1.234', 3, '1.234'), 3);
    assert.equal(M.caretAfterFormat('12345', 1, '12.345'), 1);
    assert.equal(M.caretAfterFormat('12345', 2, '12.345'), 2);
    assert.equal(M.caretAfterFormat('12345', 3, '12.345'), 4);
    // số 0 đầu bị loại: "007|" -> "7|"
    assert.equal(M.caretAfterFormat('007', 3, '7'), 1);
    assert.equal(M.caretAfterFormat('', 0, ''), 0);
    // con trỏ ở đầu giữ ở đầu
    assert.equal(M.caretAfterFormat('1234', 0, '1.234'), 0);
  });
});

test.describe('Ngày theo giờ địa phương', () => {
  test('todayStr dùng giờ địa phương, không dùng UTC (23:59 vẫn là hôm nay)', () => {
    assert.equal(M.todayStr(new Date(2026, 9, 27, 23, 59, 59)), '2026-10-27');
    assert.equal(M.todayStr(new Date(2026, 9, 27, 0, 0, 1)), '2026-10-27');
  });
  test('yesterdayStr qua ranh giới tháng, năm, năm nhuận', () => {
    assert.equal(M.yesterdayStr(new Date(2026, 9, 27)), '2026-10-26');
    assert.equal(M.yesterdayStr(new Date(2026, 10, 1)), '2026-10-31');
    assert.equal(M.yesterdayStr(new Date(2027, 0, 1)), '2026-12-31');
    assert.equal(M.yesterdayStr(new Date(2028, 2, 1)), '2028-02-29');
    assert.equal(M.yesterdayStr(new Date(2027, 2, 1)), '2027-02-28');
  });
  test('isRealDate', () => {
    for (const s of ['2026-10-27', '2028-02-29', '2000-01-01', '2026-12-31']) assert.ok(M.isRealDate(s), s);
    for (const s of ['', '2026-02-30', '2027-02-29', '2026-13-01', '2026-00-10', '2026-10-00', '2026-10-32', '26-10-27', '2026/10/27', '2026-1-5', 'abc', null, undefined, 20261027])
      assert.ok(!M.isRealDate(s), String(s));
  });
});

test.describe('Ghi chú', () => {
  test('charLen đếm theo ký tự (emoji = 1, tiếng Việt có dấu = 1)', () => {
    assert.equal(M.charLen('Ăn trưa'), 7);
    assert.equal(M.charLen('😀😀'), 2);
    assert.equal(M.charLen(''), 0);
    assert.equal(M.charLen(null), 0);
  });
  test('normalizeNote: trim, bỏ \\r, tối đa 2 dòng', () => {
    assert.equal(M.normalizeNote('  Ăn trưa  '), 'Ăn trưa');
    assert.equal(M.normalizeNote('a\r\nb'), 'a\nb');
    assert.equal(M.normalizeNote('a\n\n\nb'), 'a\nb');
    assert.equal(M.normalizeNote('a\nb\nc\nd'), 'a\nb c d');
    assert.equal(M.normalizeNote('   \n  '), '');
    assert.equal(M.normalizeNote(null), '');
    assert.equal(M.normalizeNote(undefined), '');
  });
  test('noteCounter: chỉ hiện khi còn < 20 ký tự; over khi vượt', () => {
    const at = (n) => M.noteCounter('x'.repeat(n));
    assert.equal(at(0).visible, false);
    assert.equal(at(100).visible, false);   // còn 20 -> chưa hiện
    assert.equal(at(101).visible, true);    // còn 19 -> hiện
    assert.equal(at(120).visible, true);
    assert.equal(at(120).over, false);
    assert.equal(at(121).over, true);
    assert.equal(at(121).left, -1);
  });
});

test.describe('Hợp lệ hóa form (US-01, US-02, F-01, F-13)', () => {
  test('form đầy đủ hợp lệ, trả về giá trị chuẩn hóa', () => {
    const r = M.validate(good(), NOW);
    assert.ok(r.ok);
    assert.deepEqual(r.errors, {});
    assert.equal(r.firstError, null);
    assert.deepEqual(r.value, { type: 'expense', amount: 55000, category: 'an-uong', date: '2026-10-27', note: 'Ăn trưa' });
    assert.ok(Number.isInteger(r.value.amount));
  });
  test('thu hợp lệ với danh mục thu', () => {
    const r = M.validate(good({ type: 'income', category: 'luong', amount: '15.000.000', note: '' }), NOW);
    assert.ok(r.ok);
    assert.equal(r.value.amount, 15000000);
    assert.equal(r.value.note, '');
  });
  test('số tiền: rỗng, 0, toàn số 0, chữ -> "Nhập số tiền lớn hơn 0"', () => {
    for (const a of ['', '0', '000', 'abc', ' ', '-', '0.0'])
      assert.equal(M.validate(good({ amount: a }), NOW).errors.amount, 'Nhập số tiền lớn hơn 0', JSON.stringify(a));
  });
  test('số tiền: 1 là hợp lệ (biên dưới); tối đa 999.999.999.999 (biên trên)', () => {
    assert.ok(M.validate(good({ amount: '1' }), NOW).ok);
    assert.ok(M.validate(good({ amount: '999.999.999.999' }), NOW).ok);
    assert.equal(M.validate(good({ amount: '999.999.999.999' }), NOW).value.amount, 999999999999);
  });
  test('chuỗi quá 12 chữ số bị cắt còn 12 chữ số (không bao giờ vượt số nguyên an toàn)', () => {
    assert.equal(M.parseAmount('1000000000000'), 100000000000);
    assert.equal(M.parseAmount('9'.repeat(40)), M.AMOUNT_MAX);
    assert.ok(Number.isSafeInteger(M.parseAmount('9'.repeat(40))));
  });
  test('thiếu danh mục -> "Chọn một danh mục"', () => {
    assert.equal(M.validate(good({ category: '' }), NOW).errors.category, 'Chọn một danh mục');
    assert.equal(M.validate(good({ category: undefined }), NOW).errors.category, 'Chọn một danh mục');
  });
  test('danh mục không thuộc loại đang chọn (Chi + Lương) bị chặn', () => {
    assert.equal(M.validate(good({ category: 'luong' }), NOW).errors.category, 'Chọn một danh mục');
    assert.equal(M.validate(good({ type: 'income', category: 'an-uong' }), NOW).errors.category, 'Chọn một danh mục');
    assert.equal(M.validate(good({ category: 'xxx' }), NOW).errors.category, 'Chọn một danh mục');
  });
  test('ngày: rỗng, định dạng sai, không có thật, tương lai, quá cũ -> "Chọn ngày hợp lệ"', () => {
    for (const d of ['', '2026-02-30', '2027-02-29', '27/10/2026', 'abc', '2026-13-01', '2026-10-28', '2099-01-01', '1999-12-31', null, undefined])
      assert.equal(M.validate(good({ date: d }), NOW).errors.date, 'Chọn ngày hợp lệ', String(d));
  });
  test('ngày: hôm nay và 01/01/2000 hợp lệ (biên); 29/02 năm nhuận hợp lệ', () => {
    assert.ok(M.validate(good({ date: '2026-10-27' }), NOW).ok);
    assert.ok(M.validate(good({ date: '2000-01-01' }), NOW).ok);
    assert.ok(M.validate(good({ date: '2024-02-29' }), NOW).ok);
  });
  test('ngày so với hôm nay theo giờ địa phương: 23:59 vẫn cho nhập hôm nay', () => {
    const late = new Date(2026, 9, 27, 23, 59, 59);
    assert.ok(M.validate(good({ date: '2026-10-27' }), late).ok);
    assert.ok(!M.validate(good({ date: '2026-10-28' }), late).ok);
    const early = new Date(2026, 9, 28, 0, 0, 1);
    assert.ok(M.validate(good({ date: '2026-10-28' }), early).ok);
  });
  test('ghi chú: 120 ký tự hợp lệ, 121 bị chặn -> "Tối đa 120 ký tự"', () => {
    assert.ok(M.validate(good({ note: 'a'.repeat(120) }), NOW).ok);
    assert.equal(M.validate(good({ note: 'a'.repeat(121) }), NOW).errors.note, 'Tối đa 120 ký tự');
  });
  test('ghi chú: tính theo ký tự thật (120 emoji hợp lệ; 121 emoji bị chặn)', () => {
    assert.ok(M.validate(good({ note: '😀'.repeat(120) }), NOW).ok);
    assert.ok(!M.validate(good({ note: '😀'.repeat(121) }), NOW).ok);
  });
  test('ghi chú: khoảng trắng hai đầu không tính vào giới hạn; ghi chú chỉ gồm khoảng trắng = rỗng', () => {
    assert.ok(M.validate(good({ note: '  ' + 'a'.repeat(120) + '  ' }), NOW).ok);
    assert.equal(M.validate(good({ note: '   ' }), NOW).value.note, '');
  });
  test('nhiều lỗi cùng lúc: firstError theo thứ tự số tiền > danh mục > ngày > ghi chú', () => {
    const r = M.validate({ type: 'expense', amount: '', category: '', date: '', note: 'a'.repeat(200) }, NOW);
    assert.deepEqual(Object.keys(r.errors).sort(), ['amount', 'category', 'date', 'note']);
    assert.equal(r.firstError, 'amount');
    assert.equal(M.validate({ type: 'expense', amount: '5', category: '', date: '', note: '' }, NOW).firstError, 'category');
    assert.equal(M.validate({ type: 'expense', amount: '5', category: 'an-uong', date: '', note: 'a'.repeat(200) }, NOW).firstError, 'date');
    assert.equal(M.validate(good({ note: 'a'.repeat(200) }), NOW).firstError, 'note');
    assert.equal(M.validate({ type: 'expense', amount: '5', category: '', date: '', note: '' }, NOW).value, null);
  });
  test('validateField chỉ trả lỗi của đúng ô', () => {
    const f = { type: 'expense', amount: '', category: '', date: '2026-10-27', note: '' };
    assert.equal(M.validateField(f, 'amount', NOW), 'Nhập số tiền lớn hơn 0');
    assert.equal(M.validateField(f, 'date', NOW), '');
    assert.equal(M.validateField(f, 'note', NOW), '');
  });
  test('không làm thay đổi form đầu vào', () => {
    const f = good({ note: '  x  ' });
    const snap = JSON.stringify(f);
    M.validate(f, NOW);
    assert.equal(JSON.stringify(f), snap);
  });
});

test.describe('Trạng thái form: khởi tạo, đổi loại, thay đổi chưa lưu', () => {
  test('chế độ Thêm: mặc định Chi, hôm nay, trống', () => {
    assert.deepEqual(M.initialForm(null, NOW), { type: 'expense', amount: '', category: '', date: '2026-10-27', note: '' });
  });
  test('chế độ Sửa: nạp đúng dữ liệu, số tiền được định dạng', () => {
    const tx = { id: 'a', type: 'income', amount: 15000000, category: 'luong', date: '2026-10-01', note: 'Lương T10', createdAt: 1, updatedAt: 2 };
    assert.deepEqual(M.initialForm(tx, NOW), { type: 'income', amount: '15.000.000', category: 'luong', date: '2026-10-01', note: 'Lương T10' });
  });
  test('đổi Chi→Thu: danh mục không thuộc loại mới bị bỏ chọn và báo categoryReset', () => {
    const r = M.switchType(good(), 'income');
    assert.equal(r.form.type, 'income');
    assert.equal(r.form.category, '');
    assert.equal(r.categoryReset, true);
    assert.equal(r.form.amount, '55.000');
    assert.equal(r.form.note, 'Ăn trưa');
  });
  test('đổi loại khi chưa chọn danh mục: không báo categoryReset', () => {
    const r = M.switchType(good({ category: '' }), 'income');
    assert.equal(r.categoryReset, false);
  });
  test('đổi sang đúng loại hiện tại: giữ nguyên (cùng tham chiếu)', () => {
    const f = good();
    assert.equal(M.switchType(f, 'expense').form, f);
    assert.equal(M.switchType(f, 'bogus').form, f);
  });
  test('đổi qua lại không làm mất số tiền/ngày/ghi chú', () => {
    const a = M.switchType(good(), 'income').form;
    const b = M.switchType(a, 'expense').form;
    assert.equal(b.amount, '55.000');
    assert.equal(b.date, '2026-10-27');
    assert.equal(b.category, '');
  });
  test('switchType không làm thay đổi form gốc', () => {
    const f = good();
    M.switchType(f, 'income');
    assert.equal(f.type, 'expense');
    assert.equal(f.category, 'an-uong');
  });
  test('isDirty: không đổi = false; đổi từng trường = true', () => {
    const init = M.initialForm(null, NOW);
    assert.equal(M.isDirty(init, init), false);
    assert.equal(M.isDirty({ ...init, amount: '5' }, init), true);
    assert.equal(M.isDirty({ ...init, category: 'an-uong' }, init), true);
    assert.equal(M.isDirty({ ...init, date: '2026-10-26' }, init), true);
    assert.equal(M.isDirty({ ...init, note: 'x' }, init), true);
    assert.equal(M.isDirty({ ...init, type: 'income' }, init), true);
  });
  test('isDirty bỏ qua khác biệt vô nghĩa: khoảng trắng ghi chú, định dạng số tiền', () => {
    const init = { type: 'expense', amount: '55.000', category: 'an-uong', date: '2026-10-27', note: 'Ăn' };
    assert.equal(M.isDirty({ ...init, note: ' Ăn ' }, init), false);
    assert.equal(M.isDirty({ ...init, amount: '55000' }, init), false);
    assert.equal(M.isDirty({ ...init, amount: '55.001' }, init), true);
  });
  test('isDirty: sửa rồi trả về giá trị cũ = không còn thay đổi', () => {
    const init = { type: 'expense', amount: '55.000', category: 'an-uong', date: '2026-10-27', note: 'Ăn' };
    const edited = { ...init, amount: '60.000' };
    assert.equal(M.isDirty(edited, init), true);
    assert.equal(M.isDirty({ ...edited, amount: '55.000' }, init), false);
  });
});

test.describe('Dấu thời gian chế độ Sửa', () => {
  const t1 = new Date(2026, 9, 27, 12, 5).getTime();
  const t2 = new Date(2026, 9, 27, 12, 40).getTime();
  test('hiện "Tạo" và "Sửa lần cuối" khi đã sửa', () => {
    assert.equal(M.timeline({ createdAt: t1, updatedAt: t2 }), 'Tạo 27/10 12:05 · Sửa lần cuối 27/10 12:40');
  });
  test('chưa sửa lần nào: chỉ hiện "Tạo"', () => {
    assert.equal(M.timeline({ createdAt: t1, updatedAt: t1 }), 'Tạo 27/10 12:05');
    assert.equal(M.timeline({ createdAt: t1 }), 'Tạo 27/10 12:05');
  });
  test('thiếu dữ liệu: chuỗi rỗng, không ném lỗi', () => {
    assert.equal(M.timeline(null), '');
    assert.equal(M.timeline({}), '');
  });
  test('dmy', () => assert.equal(M.dmy('2026-01-05'), '05/01/2026'));
});
