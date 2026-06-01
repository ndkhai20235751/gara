# Các việc cần làm khi đăng ký — theo từng vai trò

Khi người dùng đăng ký, hệ thống phải ghi vào **nhiều bảng** tùy theo vai trò.
Bảng `nguoi_dung` là bảng gốc cho **tất cả** vai trò.

---

## Sơ đồ tổng quan

```
Đăng ký
  └── [TẤT CẢ]  → INSERT vào nguoi_dung
        ├── khachhang   → INSERT vào khach_hang
        ├── chuxuong    → INSERT vào chu_xuong
        ├── thokythuat  → INSERT vào tho_ky_thuat
        └── ketoan      → INSERT vào ke_toan
```

---

## 1. Vai trò: Khách hàng (`khachhang`)

### Bảng 1: `nguoi_dung`
| Cột | Giá trị |
|-----|---------|
| `tendangnhap` | Họ và tên nhập vào |
| `matkhau` | bcrypt hash của mật khẩu |
| `vaitro` | `'khachhang'` |
| `trangthaitaikhoan` | `'true'` |
| `email` | Email nhập vào |

### Bảng 2: `khach_hang`
| Cột | Giá trị |
|-----|---------|
| `manguoidung` | ID vừa tạo ở `nguoi_dung` |
| `tencongty` | Họ và tên (dùng làm tên công ty) |
| `sodienthoai` | Số điện thoại nhập vào |
| `email` | Email nhập vào |
| `diachi` | `''` (để trống, cập nhật sau) |

- [x] Tạo record `nguoi_dung`
- [x] Tạo record `khach_hang`
- [x] Liên kết `khach_hang.manguoidung` → `nguoi_dung.manguoidung`

---

## 2. Vai trò: Chủ xưởng (`chuxuong`)

### Bảng 1: `nguoi_dung`
| Cột | Giá trị |
|-----|---------|
| `tendangnhap` | Họ và tên nhập vào |
| `matkhau` | bcrypt hash của mật khẩu |
| `vaitro` | `'chuxuong'` |
| `trangthaitaikhoan` | `'true'` |
| `email` | Email nhập vào |

### Bảng 2: `chu_xuong`
| Cột | Giá trị |
|-----|---------|
| `manguoidung` | ID vừa tạo ở `nguoi_dung` |
| `hoten` | Họ và tên nhập vào |
| `sodienthoai` | Số điện thoại nhập vào |
| `email` | Email nhập vào |

- [x] Tạo record `nguoi_dung`
- [x] Tạo record `chu_xuong`
- [x] Liên kết `chu_xuong.manguoidung` → `nguoi_dung.manguoidung`

---

## 3. Vai trò: Thợ kỹ thuật (`thokythuat`)

### Bảng 1: `nguoi_dung`
| Cột | Giá trị |
|-----|---------|
| `tendangnhap` | Họ và tên nhập vào |
| `matkhau` | bcrypt hash của mật khẩu |
| `vaitro` | `'thokythuat'` |
| `trangthaitaikhoan` | `'true'` |
| `email` | Email nhập vào |

### Bảng 2: `tho_ky_thuat`
| Cột | Giá trị |
|-----|---------|
| `manguoidung` | ID vừa tạo ở `nguoi_dung` |
| `hoten` | Họ và tên nhập vào |
| `sodienthoai` | Số điện thoại nhập vào |
| `vitribientai` | `''` (để trống, cập nhật theo thực tế) |
| `trangthai` | `'Rảnh'` (mặc định sẵn sàng nhận việc) |

- [x] Tạo record `nguoi_dung`
- [x] Tạo record `tho_ky_thuat`
- [x] Liên kết `tho_ky_thuat.manguoidung` → `nguoi_dung.manguoidung`

---

## 4. Vai trò: Kế toán (`ketoan`)

### Bảng 1: `nguoi_dung`
| Cột | Giá trị |
|-----|---------|
| `tendangnhap` | Họ và tên nhập vào |
| `matkhau` | bcrypt hash của mật khẩu |
| `vaitro` | `'ketoan'` |
| `trangthaitaikhoan` | `'true'` |
| `email` | Email nhập vào |

### Bảng 2: `ke_toan`
| Cột | Giá trị |
|-----|---------|
| `manguoidung` | ID vừa tạo ở `nguoi_dung` |
| `hoten` | Họ và tên nhập vào |
| `sodienthoai` | Số điện thoại nhập vào |
| `email` | Email nhập vào |

- [x] Tạo record `nguoi_dung`
- [x] Tạo record `ke_toan`
- [x] Liên kết `ke_toan.manguoidung` → `nguoi_dung.manguoidung`

---

## Luồng xử lý trong code

```
POST /api/auth/register
  ├── Validate: hoten, sodienthoai, email, matkhau, vaitro
  ├── Kiểm tra email trùng (nguoi_dung)
  ├── bcrypt.hash(matkhau)
  ├── NguoiDungModel.create(...)         → lấy manguoidung
  └── Tùy vaitro:
        khachhang   → KhachHangModel.create(...)
        chuxuong    → ChuXuongModel.create(...)
        thokythuat  → ThoKyThuatModel.create(...)
        ketoan      → KeToanModel.create(...)
```

---

## Các file liên quan

| File | Đường dẫn |
|------|-----------|
| Route | `server/routes/authRotutes.js` |
| Controller | `server/controllers/authController.js` |
| Model người dùng | `server/models/nguoiDungModel.js` |
| Model khách hàng | `server/models/khachHangModel.js` |
| Model chủ xưởng | `server/models/chuXuongModel.js` |
| Model thợ kỹ thuật | `server/models/thoModel.js` |
| Model kế toán | `server/models/keToanModel.js` |
| Kết nối DB | `server/config/superbase.js` |

---

## Code chi tiết

### `server/routes/authRotutes.js`

```js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.dangNhap);
router.post('/register', authController.dangKy);

module.exports = router;
```

---

### `server/controllers/authController.js` — hàm `dangKy`

```js
dangKy: async (req, res) => {
    const { hoten, sodienthoai, email, matkhau, vaitro } = req.body;

    const VAITRO_HOP_LE = ['khachhang', 'chuxuong', 'thokythuat', 'ketoan'];

    // 1. Validate đầu vào
    if (!hoten || !sodienthoai || !email || !matkhau || !vaitro)
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    if (!VAITRO_HOP_LE.includes(vaitro))
        return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });

    // 2. Kiểm tra email trùng
    const nguoiDungCu = await NguoiDungModel.getByEmail(email);
    if (nguoiDungCu)
        return res.status(409).json({ success: false, message: 'Email này đã được đăng ký' });

    // 3. Hash mật khẩu
    const hash = await bcrypt.hash(matkhau, 10);

    // 4. Tạo nguoi_dung
    const nguoiDungMoi = await NguoiDungModel.create({
        tendangnhap: hoten,
        matkhau: hash,
        vaitro,
        trangthaitaikhoan: 'true',
        email,
    });

    // 5. Tạo hồ sơ riêng theo vai trò
    const manguoidung = nguoiDungMoi.manguoidung;
    if (vaitro === 'khachhang') {
        await KhachHangModel.create({ manguoidung, tencongty: hoten, sodienthoai, email, diachi: '' });
    } else if (vaitro === 'chuxuong') {
        await ChuXuongModel.create({ manguoidung, hoten, sodienthoai, email });
    } else if (vaitro === 'thokythuat') {
        await ThoKyThuatModel.create({ manguoidung, hoten, sodienthoai, vitribientai: '', trangthai: 'Rảnh' });
    } else if (vaitro === 'ketoan') {
        await KeToanModel.create({ manguoidung, hoten, sodienthoai, email });
    }

    return res.status(201).json({ success: true, message: 'Đăng ký thành công' });
}
```

---

### `server/models/nguoiDungModel.js`

```js
const NguoiDungModel = {
  getAll:     async () => { const { data, error } = await supabase.from('nguoi_dung').select('*'); if (error) throw error; return data; },
  getById:    async (id) => { const { data, error } = await supabase.from('nguoi_dung').select('*').eq('manguoidung', id).single(); if (error) throw error; return data; },
  getByEmail: async (email) => { const { data, error } = await supabase.from('nguoi_dung').select('*').eq('email', email).maybeSingle(); if (error) return null; return data; },
  create:     async (userData) => { const { data, error } = await supabase.from('nguoi_dung').insert([userData]).select(); if (error) throw error; return data[0]; },
  update:     async (id, updateData) => { const { data, error } = await supabase.from('nguoi_dung').update(updateData).eq('manguoidung', id).select(); if (error) throw error; return data[0]; },
  delete:     async (id) => { const { error } = await supabase.from('nguoi_dung').delete().eq('manguoidung', id); if (error) throw error; return true; },
};
```

---

### `server/models/khachHangModel.js`

```js
const KhachHangModel = {
  getAll:          async () => { ... supabase.from('khach_hang').select('*') },
  getById:         async (id) => { ... .eq('makhachhang', id).single() },
  getByMaNguoiDung: async (manguoidung) => { ... .eq('manguoidung', manguoidung).maybeSingle() },
  create:          async (customerData) => { ... .insert([customerData]).select() },
};
```

> `create` nhận: `{ manguoidung, tencongty, sodienthoai, email, diachi }`

---

### `server/models/chuXuongModel.js`

```js
const ChuXuongModel = {
  create:        async (data_cx) => { ... supabase.from('chu_xuong').insert([data_cx]).select() },
  getThongTin:   async () => { ... supabase.from('chu_xuong').select('*') },
  updateThongTin: async (id, updateData) => { ... .update(updateData).eq('id', id) },
};
```

> `create` nhận: `{ manguoidung, hoten, sodienthoai, email }`

---

### `server/models/thoModel.js`

```js
const ThoKyThuatModel = {
  getAll:  async () => { ... supabase.from('tho_ky_thuat').select('*') },
  getById: async (id) => { ... .eq('id', id).single() },
  create:  async (dataTho) => { ... .insert([dataTho]).select() },
  update:  async (id, updateData) => { ... .update(updateData).eq('id', id) },
};
```

> `create` nhận: `{ manguoidung, hoten, sodienthoai, vitribientai, trangthai }`

---

### `server/models/keToanModel.js`

```js
const KeToanModel = {
  getAll:  async () => { ... supabase.from('ke_toan').select('*') },
  create:  async (data_kt) => { ... .insert([data_kt]).select() },
};
```

> `create` nhận: `{ manguoidung, hoten, sodienthoai, email }`

---

## Trạng thái hiện tại

| Vai trò | `nguoi_dung` | Bảng riêng | Backend | Frontend |
|---------|:---:|:---:|:---:|:---:|
| khachhang | ✅ | ✅ `khach_hang` | ✅ | ✅ |
| chuxuong | ✅ | ✅ `chu_xuong` | ✅ | ✅ |
| thokythuat | ✅ | ✅ `tho_ky_thuat` | ✅ | ✅ |
| ketoan | ✅ | ✅ `ke_toan` | ✅ | ✅ |
