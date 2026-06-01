# Tổng hợp những gì đã làm — Hệ thống Gara

> Tài liệu mô tả toàn bộ luồng nghiệp vụ đã được triển khai, kèm code thực tế.

---

## Luồng tổng thể

```
[Khách hàng] Gửi yêu cầu sửa chữa
        ↓
[Chủ xưởng] Duyệt → Phân công thợ  →  Tạo Lệnh sửa chữa
        ↓
[Thợ kỹ thuật] Nhận lệnh → Đến hiện trường → Lập Phiếu giám định
        ↓
[Kế toán] Nhận phiếu giám định → Lập Phiếu báo giá → In PDF
        ↓
[Khách hàng] Nhận báo giá, phê duyệt
```

---

## Phần 1 — Chủ xưởng phân công công việc

### API: `POST /api/chu-xuong/duyet`

**File:** `server/controllers/chuXuongController.js`

```javascript
duyetVaPhanCong: async (req, res) => {
  const { mayeucau, matho, mucdouutien } = req.body;

  // Tự động tạo hồ sơ chủ xưởng nếu chưa có trong bảng chu_xuong
  let chuXuong = await ChuXuongModel.getByMaNguoiDung(req.nguoiDung.id);
  if (!chuXuong) {
    const { data: nd } = await supabase
      .from('nguoi_dung')
      .select('tendangnhap, sodienthoai, email')
      .eq('manguoidung', req.nguoiDung.id)
      .maybeSingle();
    chuXuong = await ChuXuongModel.create({
      manguoidung: req.nguoiDung.id,
      hoten: nd.tendangnhap,
      sodienthoai: nd.sodienthoai || '',
      email: nd.email || '',
    });
  }

  // Cập nhật phiếu yêu cầu
  await supabase
    .from('phieu_yeu_cau')
    .update({ trangthai: 'Đã phân công' })
    .eq('mayeucau', mayeucau);

  // Tạo lệnh sửa chữa
  const lenh = await LenhSuaChuaModel.create({
    mayeucau,
    matho,
    machuxuong: chuXuong.machuxuong,   // NOT NULL — phải có
    thoigianphancong: new Date().toISOString(),
    mucdouutien: mucdouutien || 'Trung bình',
    trangthai: 'Chờ nhận',
  });
}
```

**Bảng thay đổi:**

| Bảng | Cột | Giá trị mới |
|------|-----|-------------|
| `phieu_yeu_cau` | `trangthai` | `"Đã phân công"` |
| `lenh_sua_chua` | toàn bộ | Bản ghi mới, `trangthai = "Chờ nhận"` |

---

### API: `GET /api/chu-xuong/lenh` *(mới thêm)*

Trả về tất cả lệnh sửa chữa kèm thông tin thợ và khách hàng cho chủ xưởng theo dõi.

```javascript
layTatCaLenh: async (req, res) => {
  const { data } = await supabase
    .from('lenh_sua_chua')
    .select(`
      *,
      tho_ky_thuat(hoten, sodienthoai, vitrihientai),
      phieu_yeu_cau(mayeucau, modelmay, vitricongtruong, motaloi, thoigiangui,
        khach_hang(tencongty, sodienthoai))
    `)
    .order('thoigianphancong', { ascending: false });
}
```

---

### Component mới: `PhanCongCongViec.js`

**File:** `client/src/pages/Owner/PhanCongCongViec.js`

Giao diện cho chủ xưởng:
- **Tab "Giao việc mới"**: hiển thị các yêu cầu chờ giao, form chọn thợ + mức ưu tiên (Thấp / Trung bình / Khẩn cấp)
- **Tab "Theo dõi lệnh"**: xem tất cả lệnh đã giao, lọc theo trạng thái, thanh tiến trình 4 bước

---

## Phần 2 — Thợ kỹ thuật nhận lệnh và lập phiếu giám định

### API: `GET /api/tho/lenh`

**File:** `server/controllers/thoKyThuatController.js`

```javascript
layLenhCuaTho: async (req, res) => {
  // 1. Xác định thợ từ JWT token
  const tho = await ThoKyThuatModel.getByMaNguoiDung(req.nguoiDung.id);

  // 2. Lấy lenh_sua_chua không dùng join (tránh lỗi FK)
  const { data: lenhTho } = await supabase
    .from('lenh_sua_chua')
    .select('*')
    .eq('matho', tho.matho);

  // 3. Lấy phieu_yeu_cau kèm khach_hang bằng query riêng
  const mayeucauList = lenhTho.map(l => l.mayeucau);
  const { data: phieuList } = await supabase
    .from('phieu_yeu_cau')
    .select('*, khach_hang(tencongty, sodienthoai)')
    .in('mayeucau', mayeucauList);

  // 4. Gắn dữ liệu join thủ công
  const danhSach = lenhTho.map(l => ({
    ...l,
    phieu_yeu_cau: phieuMap[l.mayeucau] || null,
  }));
}
```

---

### API: `PATCH /api/tho/lenh/:malenh/nhan`

```javascript
nhanLenh: async (req, res) => {
  await LenhSuaChuaModel.updateTrangThai(malenh, 'Đã nhận lệnh');
}
```

---

### API: `PATCH /api/tho/lenh/:malenh/den`

```javascript
denHienTruong: async (req, res) => {
  await LenhSuaChuaModel.updateTrangThai(malenh, 'Đã đến hiện trường');

  // Đồng bộ phiếu yêu cầu
  await supabase
    .from('phieu_yeu_cau')
    .update({ trangthai: 'Đang kiểm tra' })
    .eq('mayeucau', lenh.mayeucau);
}
```

---

### API: `POST /api/tho/phieu-bao-kham` — Lập phiếu giám định

```javascript
nopPhieuGiamDinh: async (req, res) => {
  const { malenh, mayeucau, sogiodongho, chandoan, phutung, giocong, ghichu } = req.body;

  // Ghép nội dung vào motachitiet
  const noiDung = [
    `Số giờ đồng hồ: ${sogiodongho}`,
    `Chẩn đoán: ${chandoan}`,
    `Phụ tùng cần thay: ${phutung}`,
    `Giờ công dự kiến: ${giocong}`,
    `Ghi chú: ${ghichu}`,
  ].join('\n');

  await PhieuBaoKhamModel.create({
    malenh,       // ← bắt buộc, FK sang lenh_sua_chua
    mayeucau,
    matho: tho.matho,
    motachitiet: noiDung,
    thoigianlap: new Date().toISOString(),
  });

  // Cập nhật trạng thái
  await LenhSuaChuaModel.updateTrangThai(malenh, 'Đã nộp phiếu');
  await supabase
    .from('phieu_yeu_cau')
    .update({ trangthai: 'Chờ báo giá' })
    .eq('mayeucau', mayeucau);
}
```

**Bảng thay đổi:**

| Bảng | Thay đổi |
|------|----------|
| `phieu_bao_kham` | Tạo bản ghi mới |
| `lenh_sua_chua` | `trangthai` → `"Đã nộp phiếu"` |
| `phieu_yeu_cau` | `trangthai` → `"Chờ báo giá"` |

---

### Giao diện thợ kỹ thuật (`Technicians/index.js`)

| Tab | Chức năng |
|-----|-----------|
| 📥 Nhận lệnh & Định vị | Hiển thị lệnh "Chờ nhận" + "Đã nhận lệnh", nút xác nhận, nút chỉ đường Google Maps |
| 🔍 Kiểm tra & Chẩn đoán | Hiển thị lệnh "Đã đến hiện trường", nút mở form phiếu giám định |
| 📄 Phiếu giám định | Xem các phiếu đã nộp |

---

## Phần 3 — Kế toán lập phiếu báo giá

### API: `GET /api/ke-toan/phieu-bao-kham`

Trả về tất cả phiếu giám định kèm thông tin khách hàng và thợ.

```javascript
layPhieuChoBaoGia: async (req, res) => {
  const danhSach = await PhieuBaoKhamModel.getAllWithJoin();
  // getAllWithJoin: SELECT *, phieu_yeu_cau(*, khach_hang(...)), tho_ky_thuat(hoten)
  // ORDER BY thoigianlap DESC
}
```

---

### API: `POST /api/ke-toan/phieu-bao-gia` — Lập báo giá

```javascript
taoBaoGia: async (req, res) => {
  const { mabaokham, mayeucau, chiphinhancong, chiphiphutung, chiphikhac, tongcong } = req.body;

  // Tự động tạo hồ sơ kế toán nếu chưa có
  let keToan = await KeToanModel.getByMaNguoiDung(req.nguoiDung.id);
  if (!keToan) {
    const { data: nd } = await supabase
      .from('nguoi_dung').select('tendangnhap, sodienthoai, email')
      .eq('manguoidung', req.nguoiDung.id).maybeSingle();
    keToan = await KeToanModel.create({
      manguoidung: req.nguoiDung.id,
      hoten: nd.tendangnhap,
      ...
    });
  }

  // Tạo phiếu báo giá
  await supabase.from('phieu_bao_gia').insert([{
    mabaokham,
    maketoan: keToan.maketoan,
    chiphinhancong: Number(chiphinhancong) || 0,
    chiphiphutung:  Number(chiphiphutung)  || 0,
    chiphikhac:     Number(chiphikhac)     || 0,
    tongcong:       Number(tongcong)        || 0,
    trangthai: 'Chờ phê duyệt',
    thoigiandapung: new Date().toISOString(),
  }]);

  // Cập nhật phiếu yêu cầu
  await supabase
    .from('phieu_yeu_cau')
    .update({ trangthai: 'Đã báo giá' })
    .eq('mayeucau', mayeucau);
}
```

---

### Giao diện kế toán (`Accountant/index.js` + `Popus/BaoGia.js`)

**Trang kế toán:**
- Hiển thị tất cả phiếu giám định nhận được từ thợ
- Phân loại: "Chờ báo giá" | "Đã báo giá"
- Parse nội dung `motachitiet` thành các trường: chẩn đoán, phụ tùng, giờ đồng hồ

**Popup BaoGia.js:**
- Form nhập chi tiết báo giá theo 4 nhóm: Nhân công / Phụ tùng / Gia công / Chi phí khác
- Tự động tính tổng tiền
- Nút **In PDF** dùng `window.print()`
- Nút **Lưu báo giá** gọi `POST /api/ke-toan/phieu-bao-gia`

---

## Trạng thái toàn bộ luồng

| Bước | Ai | `lenh_sua_chua.trangthai` | `phieu_yeu_cau.trangthai` |
|------|-----|--------------------------|--------------------------|
| Chủ xưởng phân công | Chủ xưởng | `Chờ nhận` | `Đã phân công` |
| Thợ nhận lệnh | Thợ kỹ thuật | `Đã nhận lệnh` | `Đã phân công` |
| Thợ đến hiện trường | Thợ kỹ thuật | `Đã đến hiện trường` | `Đang kiểm tra` |
| Thợ nộp phiếu giám định | Thợ kỹ thuật | `Đã nộp phiếu` | `Chờ báo giá` |
| Kế toán lập báo giá | Kế toán | *(không đổi)* | `Đã báo giá` |

---

## Danh sách file đã tạo / sửa

### File mới tạo
| File | Mô tả |
|------|-------|
| `client/src/pages/Owner/PhanCongCongViec.js` | Trang quản lý phân công công việc |
| `client/src/pages/Owner/PhanCongCongViec.css` | Styles cho PhanCongCongViec |
| `LUONG_THO_NHAN_LENH.md` | Tài liệu luồng thợ nhận lệnh |
| `TONG_HOP_DA_LAM.md` | File này |

### File đã sửa
| File | Nội dung sửa |
|------|-------------|
| `server/controllers/chuXuongController.js` | Thêm `layTatCaLenh`, sửa `thoigianphancong`, auto-create `chu_xuong` profile, sửa `vitrihientai` |
| `server/controllers/thoKyThuatController.js` | Thêm `debugTho`, rewrite `layLenhCuaTho` dùng 2 query riêng, thêm `malenh` vào phieu_bao_kham insert |
| `server/controllers/keToanController.js` | Auto-create `ke_toan` profile nếu chưa có |
| `server/models/lenhSuaChuaModel.js` | Sửa `thoigianphancong` (từ `thoianhphancong`) |
| `server/routes/chuXuongRoutes.js` | Thêm `GET /lenh` |
| `server/routes/thoKyThuatRoutes.js` | Thêm `GET /debug` |
| `client/src/services/api.js` | Thêm `layTatCaLenh` |
| `client/src/pages/Owner/index.js` | Thêm tab "Phân công công việc", import PhanCongCongViec, sửa `vitrihientai` |
| `client/src/pages/Technicians/index.js` | Sửa `thoigianphancong` |
| `client/src/pages/Owner/PhanCongCongViec.js` | Sửa `vitrihientai`, `thoigianphancong` |

---

## Các lỗi đã fix

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| `column thoianhphancong does not exist` | Tên cột sai trong code | Sửa thành `thoigianphancong` ở 4 file |
| `null value in column "machuxuong"` | Tài khoản chủ xưởng không có hồ sơ trong `chu_xuong` | Auto-create hồ sơ từ `nguoi_dung` |
| `null value in column "maketoan"` *(tiềm ẩn)* | Tài khoản kế toán không có hồ sơ trong `ke_toan` | Auto-create hồ sơ từ `nguoi_dung` |
| `phieu_bao_kham` thiếu `malenh` | Code không truyền `malenh` khi insert | Thêm `malenh` vào `PhieuBaoKhamModel.create` |
| `vitribientai` không tồn tại | Tên cột sai, đúng là `vitrihientai` | Sửa ở 3 file |

---

## Các API endpoint hoàn chỉnh

| Method | Endpoint | Vai trò | Mô tả |
|--------|----------|---------|-------|
| `POST` | `/api/chu-xuong/duyet` | Chủ xưởng | Duyệt & phân công thợ |
| `GET` | `/api/chu-xuong/yeu-cau` | Chủ xưởng | Xem tất cả yêu cầu |
| `GET` | `/api/chu-xuong/danh-sach-tho` | Chủ xưởng | Danh sách thợ |
| `GET` | `/api/chu-xuong/lenh` | Chủ xưởng | Tất cả lệnh đã giao |
| `PATCH` | `/api/chu-xuong/tuchoi/:id` | Chủ xưởng | Từ chối yêu cầu |
| `GET` | `/api/tho/lenh` | Thợ kỹ thuật | Lệnh của thợ đang đăng nhập |
| `PATCH` | `/api/tho/lenh/:id/nhan` | Thợ kỹ thuật | Xác nhận nhận lệnh |
| `PATCH` | `/api/tho/lenh/:id/den` | Thợ kỹ thuật | Xác nhận đến hiện trường |
| `POST` | `/api/tho/phieu-bao-kham` | Thợ kỹ thuật | Nộp phiếu giám định |
| `GET` | `/api/ke-toan/phieu-bao-kham` | Kế toán | Xem phiếu giám định từ thợ |
| `POST` | `/api/ke-toan/phieu-bao-gia` | Kế toán | Lập phiếu báo giá |
