# Hướng dẫn: Khách hàng gửi phiếu yêu cầu → lưu DB → hiển thị màn hình

---

## BƯỚC 1 — Tạo bảng trong Supabase

Vào Supabase → **SQL Editor** → chạy lệnh sau:

```sql
CREATE TABLE phieu_yeu_cau (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  makh        TEXT NOT NULL,
  loaimay     TEXT NOT NULL,
  diadiem     TEXT NOT NULL,
  sodienthoai TEXT NOT NULL,
  mota        TEXT NOT NULL,
  trangthai   TEXT NOT NULL DEFAULT 'Chờ tiếp nhận',
  ngaytao     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> `makh` = ID của khách hàng (lấy từ cột `manguoidung` trong bảng `nguoi_dung`)

---

## BƯỚC 2 — Cập nhật Model (server/models/phieuYeuCauModel.js)

**Thêm hàm `getByKhachHang` vào cuối object:**

```js
getByKhachHang: async (makh) => {
  const { data, error } = await supabase
    .from('phieu_yeu_cau')
    .select('*')
    .eq('makh', makh)
    .order('ngaytao', { ascending: false });
  if (error) throw error;
  return data;
},
```

---

## BƯỚC 3 — Tạo file Controller (server/controllers/phieuYeuCauController.js)

**Tạo file mới, nội dung:**

```js
const PhieuYeuCauModel = require('../models/phieuYeuCauModel');

const phieuYeuCauController = {

  // POST /api/phieu-yeu-cau — Khách hàng gửi phiếu mới
  taoPhieu: async (req, res) => {
    try {
      const { loaimay, diadiem, sodienthoai, mota } = req.body;
      const makh = req.nguoiDung.id; // lấy từ JWT token

      if (!loaimay || !diadiem || !sodienthoai || !mota) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin',
        });
      }

      const phieu = await PhieuYeuCauModel.create({
        makh,
        loaimay,
        diadiem,
        sodienthoai,
        mota,
        trangthai: 'Chờ tiếp nhận',
        ngaytao: new Date().toISOString(),
      });

      return res.status(201).json({
        success: true,
        message: 'Gửi yêu cầu thành công',
        phieu,
      });
    } catch (error) {
      console.error('Lỗi tạo phiếu:', error.message);
      return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message });
    }
  },

  // GET /api/phieu-yeu-cau — Lấy danh sách phiếu của khách hàng đang đăng nhập
  layDanhSach: async (req, res) => {
    try {
      const makh = req.nguoiDung.id;
      const danhSach = await PhieuYeuCauModel.getByKhachHang(makh);
      return res.status(200).json({ success: true, danhSach });
    } catch (error) {
      console.error('Lỗi lấy danh sách:', error.message);
      return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message });
    }
  },

};

module.exports = phieuYeuCauController;
```

---

## BƯỚC 4 — Tạo file Routes (server/routes/phieuYeuCauRoutes.js)

**Tạo file mới, nội dung:**

```js
const express = require('express');
const router = express.Router();
const phieuYeuCauController = require('../controllers/phieuYeuCauController');
const { xacThucToken } = require('../middleware/authMiddleware');

router.post('/', xacThucToken, phieuYeuCauController.taoPhieu);
router.get('/', xacThucToken, phieuYeuCauController.layDanhSach);

module.exports = router;
```

---

## BƯỚC 5 — Đăng ký route trong server/index.js

**Thêm 2 dòng này vào sau phần `authRoutes`:**

```js
// Thêm dòng này (require)
const phieuYeuCauRoutes = require('./routes/phieuYeuCauRoutes');

// Thêm dòng này (use)
app.use('/api/phieu-yeu-cau', phieuYeuCauRoutes);
```

Sau khi thêm, phần routes trong `index.js` sẽ trông như sau:

```js
const authRoutes = require('./routes/authRotutes');
app.use('/api/auth', authRoutes);

const phieuYeuCauRoutes = require('./routes/phieuYeuCauRoutes');
app.use('/api/phieu-yeu-cau', phieuYeuCauRoutes);
```

---

## BƯỚC 6 — Thêm hàm API vào client/src/services/api.js

**Thêm 2 hàm này vào cuối file:**

```js
// Gửi phiếu yêu cầu mới
export const guiYeuCau = async (formData) => {
  const token = sessionStorage.getItem('token');
  try {
    const response = await axios.post(`${API_URL}/phieu-yeu-cau`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Gửi yêu cầu thất bại');
    throw new Error('Không kết nối được đến server');
  }
};

// Lấy danh sách phiếu yêu cầu của khách hàng
export const layDanhSachYeuCau = async () => {
  const token = sessionStorage.getItem('token');
  try {
    const response = await axios.get(`${API_URL}/phieu-yeu-cau`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response) throw new Error(error.response.data.message || 'Lấy danh sách thất bại');
    throw new Error('Không kết nối được đến server');
  }
};
```

---

## BƯỚC 7 — Cập nhật client/src/pages/Customers/index.js

### 7a. Sửa dòng import đầu file — thêm 2 hàm mới:

```js
// Dòng cũ:
import React, { useState } from 'react';

// Sửa thành:
import React, { useState, useEffect } from 'react';
```

```js
// Thêm import hàm API (đặt cùng chỗ import):
import { guiYeuCau, layDanhSachYeuCau } from '../../services/api';
```

### 7b. Xóa dữ liệu giả `initialOrders`, thay bằng mảng rỗng:

```js
// Xóa toàn bộ const initialOrders = [...] (dòng 8-31)

// Sửa dòng này:
const [orders, setOrders] = useState(initialOrders);

// Thành:
const [orders, setOrders] = useState([]);
const [dangTai, setDangTai] = useState(false);
const [loiApi, setLoiApi] = useState('');
```

### 7c. Thêm useEffect để load dữ liệu từ DB khi vào trang:

```js
// Thêm vào bên trong component, SAU các useState:
useEffect(() => {
  const taiDuLieu = async () => {
    setDangTai(true);
    try {
      const ketQua = await layDanhSachYeuCau();
      setOrders(ketQua.danhSach || []);
    } catch (error) {
      setLoiApi('Không tải được danh sách: ' + error.message);
    } finally {
      setDangTai(false);
    }
  };
  taiDuLieu();
}, []);
```

### 7d. Sửa hàm `handleSubmitRequest` — gọi API thay vì cập nhật state trực tiếp:

```js
// Xóa hàm cũ:
const handleSubmitRequest = (e) => {
  e.preventDefault();
  const newOrder = { ... };
  setOrders([newOrder, ...orders]);
  setNewForm(emptyForm);
  setShowNewRequest(false);
};

// Thay bằng:
const handleSubmitRequest = async (e) => {
  e.preventDefault();
  setDangTai(true);
  try {
    await guiYeuCau({
      loaimay:     newForm.machineModel,
      diadiem:     newForm.location,
      sodienthoai: newForm.phone,
      mota:        newForm.description,
    });
    // Tải lại danh sách từ DB sau khi gửi thành công
    const ketQua = await layDanhSachYeuCau();
    setOrders(ketQua.danhSach || []);
    setNewForm(emptyForm);
    setShowNewRequest(false);
  } catch (error) {
    alert('Lỗi gửi yêu cầu: ' + error.message);
  } finally {
    setDangTai(false);
  }
};
```

### 7e. Sửa phần hiển thị danh sách — dùng tên cột từ DB:

Trong phần `orders.map(...)`, thay các field tên cũ thành tên cột DB:

| Tên cũ (frontend) | Tên mới (DB) |
|---|---|
| `order.machineModel` | `order.loaimay` |
| `order.location` | `order.diadiem` |
| `order.phone` | `order.sodienthoai` |
| `order.description` | `order.mota` |
| `order.status` | `order.trangthai` |
| `order.date` | `new Date(order.ngaytao).toLocaleString('vi-VN')` |
| `order.id` | `order.id` (giữ nguyên) |

---

## Tóm tắt các file cần thay đổi

| File | Loại thay đổi |
|---|---|
| Supabase SQL Editor | Tạo bảng `phieu_yeu_cau` |
| `server/models/phieuYeuCauModel.js` | Thêm hàm `getByKhachHang` |
| `server/controllers/phieuYeuCauController.js` | **Tạo file mới** |
| `server/routes/phieuYeuCauRoutes.js` | **Tạo file mới** |
| `server/index.js` | Thêm 2 dòng đăng ký route |
| `client/src/services/api.js` | Thêm 2 hàm `guiYeuCau`, `layDanhSachYeuCau` |
| `client/src/pages/Customers/index.js` | Sửa 4 chỗ (import, state, useEffect, handler, map) |
