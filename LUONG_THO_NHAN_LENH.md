# Luồng: Thợ kỹ thuật nhận lệnh sửa chữa

> Mô tả toàn bộ các bước từ khi chủ xưởng phân công đến khi thợ kỹ thuật hoàn thành kiểm tra và nộp phiếu giám định.

---

## Tổng quan luồng

```
[Chủ xưởng] Duyệt & Phân công
        │
        ▼
  Tạo bản ghi lenh_sua_chua
  trangthai = "Chờ nhận"
        │
        ▼
[Thợ kỹ thuật] Thấy lệnh mới → Xác nhận nhận lệnh
  trangthai = "Đã nhận lệnh"
        │
        ▼
[Thợ kỹ thuật] Đến hiện trường
  trangthai = "Đã đến hiện trường"
  phieu_yeu_cau.trangthai = "Đang kiểm tra"
        │
        ▼
[Thợ kỹ thuật] Lập & gửi phiếu giám định
  Tạo bản ghi phieu_bao_kham
  trangthai = "Đã nộp phiếu"
  phieu_yeu_cau.trangthai = "Chờ báo giá"
```

---

## Bước 1 — Chủ xưởng phân công

**Endpoint:** `POST /api/chu-xuong/duyet`

**Request body:**
```json
{
  "mayeucau": 5,
  "matho": 2,
  "mucdouutien": "Khẩn cấp"
}
```

**Controller thực hiện (`chuXuongController.js`):**
```javascript
// 1. Cập nhật phiếu yêu cầu → "Đã phân công"
await supabase
  .from('phieu_yeu_cau')
  .update({ trangthai: 'Đã phân công' })
  .eq('mayeucau', mayeucau);

// 2. Tạo lệnh sửa chữa mới
const lenh = await LenhSuaChuaModel.create({
  mayeucau,
  matho,
  machuxuong: chuXuong.machuxuong,
  thoigianphancong: new Date().toISOString(),
  mucdouutien: mucdouutien || 'Trung bình',
  trangthai: 'Chờ nhận',
});
```

**Kết quả trong DB:**

| Bảng | Thay đổi |
|------|----------|
| `phieu_yeu_cau` | `trangthai` → `"Đã phân công"` |
| `lenh_sua_chua` | Tạo bản ghi mới, `trangthai = "Chờ nhận"` |

---

## Bước 2 — Thợ xem danh sách lệnh được giao

**Endpoint:** `GET /api/tho/lenh`

**Yêu cầu:** Header `Authorization: Bearer <token>`

**Model (`lenhSuaChuaModel.js`):**
```javascript
getByMatho: async (matho) => {
  const { data, error } = await supabase
    .from('lenh_sua_chua')
    .select('*, phieu_yeu_cau(*, khach_hang(tencongty, sodienthoai))')
    .eq('matho', matho)
    .order('thoigianphancong', { ascending: false });
  return data;
}
```

**Response trả về:**
```json
{
  "success": true,
  "thoInfo": { "matho": 2, "hoten": "Nguyễn Văn A", ... },
  "danhSach": [
    {
      "malenh": 10,
      "trangthai": "Chờ nhận",
      "mucdouutien": "Khẩn cấp",
      "thoigianphancong": "2025-05-25T08:00:00Z",
      "phieu_yeu_cau": {
        "modelmay": "Komatsu PC200",
        "vitricongtruong": "Công trình A, Quận 9",
        "motaloi": "Máy không khởi động được",
        "khach_hang": { "tencongty": "Công ty XYZ" }
      }
    }
  ]
}
```

**Frontend lấy dữ liệu (`Technicians/index.js`):**
```javascript
const taiDuLieu = async () => {
  const res = await layLenhCuaTho();   // GET /api/tho/lenh
  setTasks(res.danhSach || []);
  setThoInfo(res.thoInfo);
};
```

**Phân loại hiển thị theo trạng thái:**
```javascript
const waiting   = tasks.filter(t => t.status === 'Chờ nhận');
const received  = tasks.filter(t => t.status === 'Đã nhận lệnh');
const onSite    = tasks.filter(t => t.status === 'Đã đến hiện trường');
const submitted = tasks.filter(t => t.status === 'Đã nộp phiếu');
```

---

## Bước 3 — Thợ xác nhận nhận lệnh

**Endpoint:** `PATCH /api/tho/lenh/:malenh/nhan`

**Controller:**
```javascript
nhanLenh: async (req, res) => {
  const { malenh } = req.params;
  await LenhSuaChuaModel.updateTrangThai(malenh, 'Đã nhận lệnh');
  return res.json({ success: true });
}
```

**Frontend gọi khi thợ bấm "Xác nhận nhận lệnh":**
```javascript
const handleConfirmReceive = async () => {
  await nhanLenh(confirmTarget.malenh);   // PATCH /api/tho/lenh/10/nhan
  await taiDuLieu();                       // Reload danh sách
};
```

**Kết quả:** `lenh_sua_chua.trangthai` → `"Đã nhận lệnh"`

---

## Bước 4 — Thợ xác nhận đã đến hiện trường

**Endpoint:** `PATCH /api/tho/lenh/:malenh/den`

**Controller:**
```javascript
denHienTruong: async (req, res) => {
  const { malenh } = req.params;

  // Cập nhật lệnh sửa chữa
  await LenhSuaChuaModel.updateTrangThai(malenh, 'Đã đến hiện trường');

  // Đồng thời cập nhật phiếu yêu cầu
  const lenh = await LenhSuaChuaModel.getByMalenh(malenh);
  await supabase
    .from('phieu_yeu_cau')
    .update({ trangthai: 'Đang kiểm tra' })
    .eq('mayeucau', lenh.mayeucau);

  return res.json({ success: true });
}
```

**Kết quả:**

| Bảng | Thay đổi |
|------|----------|
| `lenh_sua_chua` | `trangthai` → `"Đã đến hiện trường"` |
| `phieu_yeu_cau` | `trangthai` → `"Đang kiểm tra"` |

---

## Bước 5 — Thợ lập và gửi phiếu giám định

**Endpoint:** `POST /api/tho/phieu-bao-kham`

**Request body:**
```json
{
  "malenh": 10,
  "mayeucau": 5,
  "sogiodongho": 2450,
  "chandoan": "Hỏng bơm thủy lực, rò rỉ dầu",
  "phutung": "Bơm thủy lực 1 cái, gioăng dầu 2 cái",
  "giocong": 8,
  "ghichu": "Cần đặt phụ tùng trước"
}
```

**Controller:**
```javascript
nopPhieuGiamDinh: async (req, res) => {
  const { malenh, mayeucau, sogiodongho, chandoan, phutung, giocong, ghichu } = req.body;

  // Lấy thông tin thợ từ token
  const tho = await ThoKyThuatModel.getByMaNguoiDung(req.nguoiDung.id);

  // Ghép nội dung phiếu
  const noiDung = [
    `Số giờ đồng hồ: ${sogiodongho}`,
    `Chẩn đoán: ${chandoan}`,
    `Phụ tùng cần thay: ${phutung}`,
    `Giờ công dự kiến: ${giocong}`,
    `Ghi chú: ${ghichu}`,
  ].join('\n');

  // Tạo phiếu bảo khám
  await PhieuBaoKhamModel.create({
    mayeucau,
    matho: tho.matho,
    motachitiet: noiDung,
    thoigianlap: new Date().toISOString(),
  });

  // Cập nhật trạng thái lệnh và phiếu yêu cầu
  await LenhSuaChuaModel.updateTrangThai(malenh, 'Đã nộp phiếu');
  await supabase
    .from('phieu_yeu_cau')
    .update({ trangthai: 'Chờ báo giá' })
    .eq('mayeucau', mayeucau);

  return res.status(201).json({ success: true });
}
```

**Kết quả:**

| Bảng | Thay đổi |
|------|----------|
| `phieu_bao_kham` | Tạo bản ghi mới |
| `lenh_sua_chua` | `trangthai` → `"Đã nộp phiếu"` |
| `phieu_yeu_cau` | `trangthai` → `"Chờ báo giá"` |

---

## Tóm tắt trạng thái qua các bước

| Bước | Người thực hiện | lenh_sua_chua.trangthai | phieu_yeu_cau.trangthai |
|------|----------------|------------------------|------------------------|
| Chủ xưởng phân công | Chủ xưởng | `Chờ nhận` | `Đã phân công` |
| Thợ nhận lệnh | Thợ kỹ thuật | `Đã nhận lệnh` | `Đã phân công` |
| Thợ đến hiện trường | Thợ kỹ thuật | `Đã đến hiện trường` | `Đang kiểm tra` |
| Thợ nộp phiếu giám định | Thợ kỹ thuật | `Đã nộp phiếu` | `Chờ báo giá` |

---

## Các API endpoint liên quan

| Method | Endpoint | Vai trò | Mô tả |
|--------|----------|---------|-------|
| `POST` | `/api/chu-xuong/duyet` | Chủ xưởng | Duyệt & phân công thợ, tạo lệnh |
| `GET` | `/api/chu-xuong/lenh` | Chủ xưởng | Xem tất cả lệnh đã giao + trạng thái |
| `GET` | `/api/tho/lenh` | Thợ kỹ thuật | Lấy danh sách lệnh của mình |
| `PATCH` | `/api/tho/lenh/:malenh/nhan` | Thợ kỹ thuật | Xác nhận nhận lệnh |
| `PATCH` | `/api/tho/lenh/:malenh/den` | Thợ kỹ thuật | Xác nhận đến hiện trường |
| `POST` | `/api/tho/phieu-bao-kham` | Thợ kỹ thuật | Nộp phiếu giám định |

---

## Các bảng dữ liệu liên quan

### `lenh_sua_chua`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `malenh` | int4 (PK) | Mã lệnh sửa chữa |
| `mayeucau` | int4 (FK) | Liên kết phiếu yêu cầu |
| `matho` | int4 (FK) | Thợ được phân công |
| `machuxuong` | int4 (FK) | Chủ xưởng phân công |
| `thoigianphancong` | timestamp | Thời điểm phân công |
| `mucdouutien` | varchar | `Thấp` / `Trung bình` / `Khẩn cấp` |
| `trangthai` | varchar | Trạng thái hiện tại của lệnh |

### `phieu_bao_kham`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `mayeucau` | int4 (FK) | Liên kết phiếu yêu cầu |
| `matho` | int4 (FK) | Thợ lập phiếu |
| `motachitiet` | text | Nội dung chẩn đoán (ghép từ các trường) |
| `thoigianlap` | timestamp | Thời điểm lập phiếu |

---

## Lưu ý

- Tên cột thời gian phân công là **`thoigianphancong`** (không phải `thoianhphancong`).
- Thợ kỹ thuật chỉ thấy các lệnh thuộc `matho` của mình — xác định qua JWT token khi đăng nhập.
- Sau khi thợ nộp phiếu giám định, bước tiếp theo là **kế toán** tạo phiếu báo giá (`phieu_bao_gia`).
