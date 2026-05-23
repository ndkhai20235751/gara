# HƯỚNG DẪN CHI TIẾT: XÂY DỰNG HỆ THỐNG ĐĂNG NHẬP
## Dự án: Quản lý Sửa chữa Máy Công Trình Khánh Nguyên

---

## TỔNG QUAN KIẾN TRÚC

```
[Trình duyệt - React]
       │
       │  POST /api/auth/login  { email, mat_khau, vai_tro }
       ▼
[Server - Express.js]
       │
       │  1. Nhận request
       │  2. Tìm user theo email trong Supabase
       │  3. So sánh mật khẩu bằng bcrypt
       │  4. Tạo JWT token
       │  5. Trả về token + thông tin user
       ▼
[Database - Supabase/PostgreSQL]
   Bảng: nguoi_dung
   Cột:  id, email, mat_khau, vai_tro, ho_ten
```

**Luồng xác thực hoàn chỉnh:**
```
Client gửi form → Server xác thực → Supabase truy vấn → bcrypt so sánh → JWT tạo token → Client lưu token → Chuyển trang theo vai trò
```

---

## BƯỚC 1: CÀI ĐẶT THƯ VIỆN CẦN THIẾT

**Chạy lệnh trong thư mục `server/`:**
```bash
npm install jsonwebtoken bcryptjs
```

### Giải thích:

**`jsonwebtoken` (JWT - JSON Web Token):**
- JWT là một chuỗi mã hóa dạng: `xxxxx.yyyyy.zzzzz` gồm 3 phần
  - **Header**: loại token và thuật toán
  - **Payload**: dữ liệu người dùng (id, email, vai_tro)
  - **Signature**: chữ ký để xác thực token không bị giả mạo
- Sau khi đăng nhập thành công, server tạo token này và gửi về client
- Mỗi request sau đó, client đính token vào header để server biết "đây là ai"

**`bcryptjs` (Mã hóa mật khẩu):**
- **KHÔNG BAO GIỜ** lưu mật khẩu dạng plaintext trong database
- bcrypt biến `"abc123"` thành `"$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"`
- Mỗi lần hash cho ra kết quả khác nhau (nhờ "salt") nhưng vẫn so sánh được
- Dù hacker lấy được database, cũng không thể đọc được mật khẩu gốc

---

## BƯỚC 2: CẤU HÌNH BIẾN MÔI TRƯỜNG

**File: `server/.env`** (thêm dòng JWT_SECRET)

```env
PORT=5000
SUPABASE_URL=https://vbiqsfwynekoggnevyjr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_OkPAUzk8eJgSaQkUkYpG8g_YEAmTc8s

# THÊM DÒNG NÀY:
JWT_SECRET=KhanhNguyen_GaraSecret_2026_XinChaoMotTroi
```

### Giải thích:

**`JWT_SECRET` là gì?**
- Đây là "mật khẩu bí mật" chỉ server biết
- Server dùng chuỗi này để **ký** (sign) token khi tạo ra
- Server cũng dùng chuỗi này để **xác minh** token khi nhận được
- Nếu ai đó tạo token giả mà không có chuỗi bí mật này → server phát hiện ngay
- **Quan trọng**: Chuỗi này phải dài, ngẫu nhiên, và KHÔNG được commit lên Git

**Tại sao dùng `.env`?**
- File `.env` không được đẩy lên GitHub (nhờ `.gitignore`)
- Mỗi môi trường (dev, production) có thể có giá trị khác nhau
- `require('dotenv').config()` ở đầu `index.js` sẽ nạp các biến này vào `process.env`

---

## BƯỚC 3: KIỂM TRA CẤU HÌNH SUPABASE CLIENT

**File hiện tại: `server/supabaseClient.js`** (đã có sẵn, dùng đúng như này)

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase };
```

### Giải thích:

**`createClient(url, key)`:**
- Tạo ra một "cầu nối" duy nhất giữa server và Supabase
- `SUPABASE_URL`: địa chỉ database của bạn trên Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: khóa đặc biệt có quyền đọc/ghi mọi thứ (chỉ dùng ở backend)

**Tại sao dùng `SERVICE_ROLE_KEY` thay vì `ANON_KEY`?**
- `anon key`: quyền hạn chế, phải tuân theo Row Level Security
- `service role key`: quyền admin, bỏ qua RLS → phù hợp cho backend tự quản lý logic xác thực

**LƯU Ý**: File `nguoiDungModel.js` đang `require('../supabase')` — đảm bảo có file `server/supabase.js`:

```javascript
// server/supabase.js  ← tạo file này nếu chưa có
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase };
```

---

## BƯỚC 4: CẬP NHẬT MODEL NGƯỜI DÙNG

**File: `server/models/nguoiDungModel.js`** — Thêm hàm `getByEmail`

```javascript
const { supabase } = require('../supabase');

const NguoiDungModel = {

  // Lấy tất cả người dùng
  getAll: async () => {
    const { data, error } = await supabase.from('nguoi_dung').select('*');
    if (error) throw error;
    return data;
  },

  // Lấy theo ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('nguoi_dung')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // ===== THÊM HÀM MỚI NÀY =====
  getByEmail: async (email) => {
    const { data, error } = await supabase
      .from('nguoi_dung')
      .select('*')
      .eq('email', email)
      .single();
    if (error) return null;   // Trả về null nếu không tìm thấy (không throw)
    return data;
  },
  // =============================

  create: async (userData) => {
    const { data, error } = await supabase
      .from('nguoi_dung')
      .insert([userData])
      .select();
    if (error) throw error;
    return data[0];
  },

  update: async (id, updateData) => {
    const { data, error } = await supabase
      .from('nguoi_dung')
      .update(updateData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  delete: async (id) => {
    const { error } = await supabase.from('nguoi_dung').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

module.exports = NguoiDungModel;
```

### Giải thích hàm `getByEmail`:

```javascript
getByEmail: async (email) => {
```
- Hàm bất đồng bộ (async) vì cần chờ database trả lời

```javascript
  const { data, error } = await supabase
    .from('nguoi_dung')       // Truy vấn bảng 'nguoi_dung'
    .select('*')              // Lấy tất cả cột
    .eq('email', email)       // WHERE email = 'abc@gmail.com'
    .single();                // Chỉ lấy 1 bản ghi (nếu >1 hoặc =0 sẽ có error)
```

```javascript
  if (error) return null;   // Nếu không tìm thấy → trả null (không crash)
  return data;              // Tìm thấy → trả về object user
```

**Tại sao `return null` thay vì `throw error`?**
- Khi user nhập email sai, đây KHÔNG phải lỗi hệ thống
- Chỉ đơn giản là "không tìm thấy" → trả null để controller xử lý tiếp
- Nếu `throw error`, Express sẽ crash hoặc trả 500 thay vì 401

---

## BƯỚC 5: TẠO AUTH CONTROLLER

**File: `server/controllers/authController.js`** (hiện đang rỗng — điền vào đây)

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NguoiDungModel = require('../models/nguoiDungModel');

const authController = {

  dangNhap: async (req, res) => {
    try {
      // ── 1. Lấy dữ liệu từ body request ──────────────────────────────────
      const { email, mat_khau, vai_tro } = req.body;

      // ── 2. Kiểm tra đủ thông tin không ──────────────────────────────────
      if (!email || !mat_khau || !vai_tro) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ email, mật khẩu và vai trò',
        });
      }

      // ── 3. Tìm người dùng theo email trong database ──────────────────────
      const nguoiDung = await NguoiDungModel.getByEmail(email);

      if (!nguoiDung) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng',
        });
      }

      // ── 4. Kiểm tra vai trò có khớp không ───────────────────────────────
      if (nguoiDung.vai_tro !== vai_tro) {
        return res.status(401).json({
          success: false,
          message: 'Vai trò không khớp với tài khoản này',
        });
      }

      // ── 5. So sánh mật khẩu với hash trong database ──────────────────────
      const matKhauDung = await bcrypt.compare(mat_khau, nguoiDung.mat_khau);

      if (!matKhauDung) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng',
        });
      }

      // ── 6. Tạo JWT token ─────────────────────────────────────────────────
      const token = jwt.sign(
        {
          id: nguoiDung.id,
          email: nguoiDung.email,
          vai_tro: nguoiDung.vai_tro,
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      // ── 7. Trả về kết quả thành công ─────────────────────────────────────
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        token: token,
        nguoiDung: {
          id: nguoiDung.id,
          email: nguoiDung.email,
          ho_ten: nguoiDung.ho_ten,
          vai_tro: nguoiDung.vai_tro,
        },
      });

    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống, vui lòng thử lại',
      });
    }
  },

};

module.exports = authController;
```

### Giải thích từng bước trong `dangNhap`:

**Bước 1 — Lấy dữ liệu từ body:**
```javascript
const { email, mat_khau, vai_tro } = req.body;
```
- `req.body` chứa JSON mà client gửi lên
- Destructuring để lấy 3 trường cần thiết

**Bước 2 — Kiểm tra đủ thông tin:**
```javascript
if (!email || !mat_khau || !vai_tro) {
  return res.status(400).json({ ... });
}
```
- `400 Bad Request`: client gửi thiếu dữ liệu, lỗi từ phía client
- `return` để dừng hàm ngay, không chạy tiếp

**Bước 3 — Tìm user trong database:**
```javascript
const nguoiDung = await NguoiDungModel.getByEmail(email);
if (!nguoiDung) { return res.status(401)... }
```
- `401 Unauthorized`: không có quyền truy cập
- Trả về thông báo chung chung "email hoặc mật khẩu không đúng" (bảo mật — không tiết lộ email có tồn tại không)

**Bước 4 — Kiểm tra vai trò:**
```javascript
if (nguoiDung.vai_tro !== vai_tro) {
  return res.status(401).json({ message: 'Vai trò không khớp...' });
}
```
- Một người có thể có nhiều tài khoản với vai trò khác nhau
- Hoặc: người dùng chọn sai vai trò khi đăng nhập

**Bước 5 — So sánh mật khẩu:**
```javascript
const matKhauDung = await bcrypt.compare(mat_khau, nguoiDung.mat_khau);
```
- `mat_khau`: chuỗi plaintext client gửi lên (ví dụ: `"abc123"`)
- `nguoiDung.mat_khau`: hash đã lưu trong DB (ví dụ: `"$2a$10$N9qo..."`)
- `bcrypt.compare()` tự động hash `"abc123"` rồi so sánh → trả `true/false`
- **Lý do không dùng `===`**: mỗi lần hash ra kết quả khác nhau, chỉ bcrypt mới biết cách so sánh đúng

**Bước 6 — Tạo JWT token:**
```javascript
const token = jwt.sign(
  { id: nguoiDung.id, email: nguoiDung.email, vai_tro: nguoiDung.vai_tro },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);
```
- **Tham số 1 - Payload**: dữ liệu nhúng vào token (không nhúng mat_khau!)
- **Tham số 2 - Secret**: chuỗi bí mật để ký token
- **Tham số 3 - Options**: `expiresIn: '8h'` → token hết hạn sau 8 giờ (1 ca làm việc)

**Bước 7 — Trả kết quả:**
```javascript
return res.status(200).json({
  success: true,
  token: token,
  nguoiDung: { id, email, ho_ten, vai_tro }  // KHÔNG trả mat_khau!
});
```
- `200 OK`: thành công
- Chỉ trả thông tin cần thiết, **tuyệt đối không trả `mat_khau`**

---

## BƯỚC 6: TẠO AUTH ROUTES

**File: `server/routes/authRotutes.js`** (hiện đang rỗng — điền vào đây)

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', authController.dangNhap);

module.exports = router;
```

### Giải thích:

```javascript
const router = express.Router();
```
- `Router` là một "mini-app" Express độc lập
- Thay vì viết `app.post(...)`, ta viết `router.post(...)`
- Giúp tách nhỏ routes theo chức năng, dễ quản lý

```javascript
router.post('/login', authController.dangNhap);
```
- Khi có request `POST` đến `/login`, gọi hàm `dangNhap`
- Đường dẫn đầy đủ sẽ là `/api/auth/login` (prefix `/api/auth` thêm ở `index.js`)

```javascript
module.exports = router;
```
- Export để `index.js` có thể import và đăng ký

---

## BƯỚC 7: ĐĂNG KÝ ROUTE TRONG INDEX.JS

**File: `server/index.js`** — Thêm import và sử dụng authRoutes

```javascript
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT;

const superbases = require('./config/superbase');
superbases.kiemTraKetNoiSupabase();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/data', (req, res) => {
  res.json({ message: 'Xin chào từ Backend Node.js!' });
});

// ===== THÊM DÒNG NÀY =====
const authRoutes = require('./routes/authRotutes');
app.use('/api/auth', authRoutes);
// ==========================

// ── Khởi động server ──────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`🚀 Server Gara đang chạy tại: http://localhost:${port}`);
});
```

### Giải thích:

```javascript
const authRoutes = require('./routes/authRotutes');
app.use('/api/auth', authRoutes);
```
- `app.use('/api/auth', authRoutes)`: gắn router vào đường dẫn `/api/auth`
- Mọi route trong `authRoutes` sẽ được prefix bằng `/api/auth`
- Kết quả: `POST /login` trong router → thực tế là `POST /api/auth/login`

**Tại sao tách routes ra file riêng?**
- Nếu có 50 routes, viết hết vào `index.js` sẽ rất lộn xộn
- Mỗi file routes phụ trách một tính năng: auth, user, order...
- Dễ đọc, dễ bảo trì, dễ tìm lỗi

---

## BƯỚC 8: TẠO MIDDLEWARE XÁC THỰC JWT (Bảo vệ routes riêng tư)

**File mới: `server/middleware/authMiddleware.js`**

```javascript
const jwt = require('jsonwebtoken');

const xacThucToken = (req, res, next) => {
  // Lấy token từ header "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có token xác thực, vui lòng đăng nhập',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, nguoiDung) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
    }
    req.nguoiDung = nguoiDung;
    next();
  });
};

module.exports = { xacThucToken };
```

### Giải thích:

**Middleware là gì?**
- Middleware là hàm chạy "ở giữa" request và response
- Nó có thể: đọc request, sửa đổi, hoặc chặn lại
- Sau khi xử lý xong, gọi `next()` để tiếp tục

**Luồng hoạt động:**
```
Request đến → xacThucToken chạy → (hợp lệ) → next() → Route handler
                                 → (không hợp lệ) → trả 401/403, dừng lại
```

```javascript
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
```
- Header có dạng: `Authorization: Bearer eyJhbGciOi...`
- `.split(' ')` tách thành `['Bearer', 'eyJhbGciOi...']`
- `[1]` lấy phần token

```javascript
jwt.verify(token, process.env.JWT_SECRET, (err, nguoiDung) => {
```
- Giải mã token dùng JWT_SECRET
- Nếu token bị sửa, giả mạo, hoặc hết hạn → `err` có giá trị
- Nếu hợp lệ → `nguoiDung` chứa payload (id, email, vai_tro)

```javascript
req.nguoiDung = nguoiDung;
next();
```
- Gắn thông tin user vào request để route handler dùng tiếp
- `next()`: tiếp tục đến route handler

**Cách dùng middleware để bảo vệ route:**
```javascript
// Ví dụ: chỉ user đã đăng nhập mới lấy được danh sách khách hàng
const { xacThucToken } = require('../middleware/authMiddleware');
router.get('/khach-hang', xacThucToken, khachHangController.getAll);
```

---

## BƯỚC 9: CẬP NHẬT SERVICES/API.JS (Frontend)

**File: `client/src/services/api.js`** — Thêm hàm `dangNhap`

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Hàm cũ - giữ nguyên
export const fetchDataFromBackend = async () => {
  try {
    const response = await axios.get(`${API_URL}/data`);
    return response.data;
  } catch (error) {
    console.error('Lỗi kết nối API:', error);
    throw error;
  }
};

// ===== THÊM HÀM MỚI NÀY =====
export const dangNhap = async (email, mat_khau, vai_tro) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      mat_khau,
      vai_tro,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server trả về lỗi (401, 400, v.v.)
      throw new Error(error.response.data.message || 'Đăng nhập thất bại');
    }
    throw new Error('Không kết nối được đến server');
  }
};
// =============================
```

### Giải thích:

```javascript
const response = await axios.post(`${API_URL}/auth/login`, {
  email, mat_khau, vai_tro,
});
```
- `axios.post(url, body)`: gửi POST request với JSON body
- `await`: chờ server trả lời (bất đồng bộ)

```javascript
if (error.response) {
  throw new Error(error.response.data.message || 'Đăng nhập thất bại');
}
throw new Error('Không kết nối được đến server');
```
- `error.response` tồn tại: server phản hồi nhưng với status lỗi (401, 400...)
- `!error.response`: server không phản hồi (mất mạng, server tắt)
- Phân biệt 2 loại lỗi để hiển thị thông báo phù hợp

---

## BƯỚC 10: CẬP NHẬT COMPONENT LOGIN (Frontend)

**File: `client/src/pages/Login/index.js`** — Thêm gọi API, loading, lỗi

```javascript
import React, { useState } from 'react';
import './style.css';
import { dangNhap } from '../../services/api';     // ← Import hàm đăng nhập

const roles = [
  {
    id: 'chu_xuong',
    name: 'Chủ xưởng',
    icon: '🏢',
    color: 'blue',
    badge: 'Quản lý',
    desc: 'Tiếp nhận yêu cầu, phân công thợ & theo dõi toàn bộ tiến độ sửa chữa',
    steps: ['Tiếp nhận & xét duyệt yêu cầu', 'Phân công thợ kỹ thuật', 'Giám sát tiến độ'],
  },
  {
    id: 'tho_ky_thuat',
    name: 'Thợ kỹ thuật',
    icon: '🔧',
    color: 'green',
    badge: 'Hiện trường',
    desc: 'Nhận lệnh điều động, di chuyển đến công trường & lập phiếu giám định',
    steps: ['Nhận lệnh & định vị', 'Kiểm tra, chẩn đoán máy', 'Gửi phiếu giám định'],
  },
  {
    id: 'ke_toan',
    name: 'Kế toán',
    icon: '📊',
    color: 'purple',
    badge: 'Văn phòng',
    desc: 'Lập báo giá chuyên nghiệp từ phiếu giám định & quản lý công nợ',
    steps: ['Nhận phiếu từ thợ', 'Lập & gửi báo giá', 'Chốt công nợ'],
  },
  {
    id: 'khach_hang',
    name: 'Khách hàng',
    icon: '👤',
    color: 'orange',
    badge: 'Đối tác',
    desc: 'Gửi yêu cầu sửa chữa, theo dõi tiến độ & phê duyệt báo giá',
    steps: ['Gửi yêu cầu sửa chữa', 'Theo dõi tiến độ', 'Phê duyệt báo giá'],
  },
];

export default function Login({ onLogin }) {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');              // Đổi từ username → email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dangTai, setDangTai] = useState(false);       // ← THÊM: trạng thái loading
  const [loi, setLoi] = useState('');                  // ← THÊM: thông báo lỗi

  const activeRole = roles.find((r) => r.id === selectedRole);

  const handleSelectRole = (id) => {
    setSelectedRole(id);
    setStep(2);
    setLoi('');   // Xóa lỗi cũ khi đổi vai trò
  };

  const handleBack = () => {
    setStep(1);
    setEmail('');
    setPassword('');
    setLoi('');
  };

  // ===== HÀM ĐĂNG NHẬP THỰC SỰ =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setDangTai(true);
    setLoi('');

    try {
      const ketQua = await dangNhap(email, password, selectedRole);

      // Lưu token vào localStorage để dùng cho các request sau
      localStorage.setItem('token', ketQua.token);
      localStorage.setItem('nguoiDung', JSON.stringify(ketQua.nguoiDung));

      // Gọi callback để App.js biết đã đăng nhập thành công
      if (onLogin) onLogin(ketQua.nguoiDung);

    } catch (error) {
      setLoi(error.message);
    } finally {
      setDangTai(false);
    }
  };

  return (
    <div className="ln-container">

      <div className="ln-brand">
        <div className="ln-brand-icon">⚙️</div>
        <div>
          <div className="ln-brand-name">Máy Công Trình Khánh Nguyên</div>
          <div className="ln-brand-sub">Hệ thống Quản lý Sửa chữa Máy móc</div>
        </div>
      </div>

      <div className="ln-card">

        {/* BƯỚC 1: CHỌN VAI TRÒ */}
        {step === 1 && (
          <>
            <div className="ln-step-header">
              <h2 className="ln-title">Bạn đăng nhập với vai trò nào?</h2>
              <p className="ln-subtitle">Chọn vai trò phù hợp để truy cập đúng tính năng</p>
            </div>

            <div className="ln-role-grid">
              {roles.map((role) => (
                <button
                  key={role.id}
                  className={`ln-role-card ln-role-${role.color}`}
                  onClick={() => handleSelectRole(role.id)}
                >
                  <div className="ln-role-top">
                    <div className={`ln-role-icon-box ln-bg-${role.color}`}>{role.icon}</div>
                    <span className={`ln-role-badge ln-badge-${role.color}`}>{role.badge}</span>
                  </div>
                  <div className="ln-role-name">{role.name}</div>
                  <div className="ln-role-desc">{role.desc}</div>
                  <ul className="ln-role-steps">
                    {role.steps.map((s, i) => (
                      <li key={i}>
                        <span className={`ln-step-dot ln-dot-${role.color}`}>{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                  <div className={`ln-role-cta ln-cta-${role.color}`}>Đăng nhập →</div>
                </button>
              ))}
            </div>

            <div className="ln-workflow-hint">
              <span className="ln-hint-icon">💡</span>
              Luồng: Khách hàng → Chủ xưởng → Thợ kỹ thuật → Kế toán → Khách hàng phê duyệt
            </div>
          </>
        )}

        {/* BƯỚC 2: FORM ĐĂNG NHẬP */}
        {step === 2 && activeRole && (
          <>
            <button className="ln-back-btn" onClick={handleBack}>
              ← Đổi vai trò
            </button>

            <div className="ln-step-header">
              <div className={`ln-selected-role-badge ln-bg-${activeRole.color}`}>
                <span>{activeRole.icon}</span>
                <span>{activeRole.name}</span>
              </div>
              <h2 className="ln-title" style={{ marginTop: '1rem' }}>Đăng nhập</h2>
              <p className="ln-subtitle">{activeRole.desc}</p>
            </div>

            {/* HIỂN THỊ LỖI NẾU CÓ */}
            {loi && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fca5a5',
                color: '#dc2626', padding: '12px 16px', borderRadius: '8px',
                marginBottom: '16px', fontSize: '14px'
              }}>
                ⚠️ {loi}
              </div>
            )}

            <form onSubmit={handleSubmit} className="ln-form">

              <div className="ln-form-group">
                <label className="ln-label">Email <span className="ln-required">*</span></label>
                <input
                  type="email"
                  required
                  className={`ln-input ln-input-focus-${activeRole.color}`}
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={dangTai}
                />
              </div>

              <div className="ln-form-group">
                <label className="ln-label">Mật khẩu <span className="ln-required">*</span></label>
                <div className="ln-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`ln-input ln-input-focus-${activeRole.color}`}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={dangTai}
                  />
                  <button
                    type="button"
                    className="ln-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="ln-form-utilities">
                <label className="ln-remember">
                  <input type="checkbox" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <a href="#forgot" className={`ln-forgot ln-link-${activeRole.color}`}>Quên mật khẩu?</a>
              </div>

              <button
                type="submit"
                className={`ln-submit-btn ln-btn-${activeRole.color}`}
                disabled={dangTai}
              >
                {dangTai ? '⏳ Đang đăng nhập...' : `${activeRole.icon} Đăng nhập với vai trò ${activeRole.name}`}
              </button>

            </form>
          </>
        )}

      </div>

      <div className="ln-footer">© 2026 Khánh Nguyên · Hệ thống quản lý sửa chữa máy công trình</div>
    </div>
  );
}
```

### Giải thích những thay đổi quan trọng:

**Thêm state mới:**
```javascript
const [email, setEmail] = useState('');       // Đổi tên từ username → email (khớp với DB)
const [dangTai, setDangTai] = useState(false); // true khi đang chờ server phản hồi
const [loi, setLoi] = useState('');            // Lưu thông báo lỗi để hiển thị
```

**Hàm handleSubmit mới:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();       // Ngăn form reload trang
  setDangTai(true);         // Bật loading, vô hiệu hóa nút
  setLoi('');               // Xóa lỗi cũ

  try {
    const ketQua = await dangNhap(email, password, selectedRole);  // Gọi API
    localStorage.setItem('token', ketQua.token);                   // Lưu token
    localStorage.setItem('nguoiDung', JSON.stringify(ketQua.nguoiDung));
    if (onLogin) onLogin(ketQua.nguoiDung);                        // Báo cho App.js
  } catch (error) {
    setLoi(error.message);  // Hiện thông báo lỗi
  } finally {
    setDangTai(false);      // Tắt loading dù thành công hay thất bại
  }
};
```

**`try/catch/finally`:**
- `try`: chạy code chính
- `catch`: chạy khi có lỗi xảy ra
- `finally`: LUÔN chạy sau cùng, dù thành công hay thất bại → dùng để tắt loading

**localStorage:**
- `localStorage.setItem('token', ...)`: lưu token vào bộ nhớ trình duyệt
- Token tồn tại kể cả khi đóng tab (khác với sessionStorage)
- Lần sau vào trang → đọc token → không cần đăng nhập lại

---

## BƯỚC 11: CẬP NHẬT APP.JS (Điều hướng theo vai trò)

**File: `client/src/App.js`** — Thay toàn bộ nội dung

```javascript
import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './pages/Login';
import OwnerDashboard from './pages/Owner';
import TechnicianDashboard from './pages/Technicians';
import AccountantDashboard from './pages/Accountant';
import CustomerDashboard from './pages/Customers';

function App() {
  const [nguoiDungDangNhap, setNguoiDungDangNhap] = useState(null);

  // Kiểm tra khi vào trang: đã đăng nhập trước chưa?
  useEffect(() => {
    const duLieu = localStorage.getItem('nguoiDung');
    if (duLieu) {
      setNguoiDungDangNhap(JSON.parse(duLieu));
    }
  }, []);

  // Khi Login component báo đăng nhập thành công
  const handleDangNhapThanhCong = (nguoiDung) => {
    setNguoiDungDangNhap(nguoiDung);
  };

  // Đăng xuất
  const handleDangXuat = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nguoiDung');
    setNguoiDungDangNhap(null);
  };

  // Chưa đăng nhập → hiện trang Login
  if (!nguoiDungDangNhap) {
    return <Login onLogin={handleDangNhapThanhCong} />;
  }

  // Đã đăng nhập → hiện dashboard theo vai trò
  const { vai_tro } = nguoiDungDangNhap;

  if (vai_tro === 'chu_xuong') {
    return <OwnerDashboard nguoiDung={nguoiDungDangNhap} onDangXuat={handleDangXuat} />;
  }

  if (vai_tro === 'tho_ky_thuat') {
    return <TechnicianDashboard nguoiDung={nguoiDungDangNhap} onDangXuat={handleDangXuat} />;
  }

  if (vai_tro === 'ke_toan') {
    return <AccountantDashboard nguoiDung={nguoiDungDangNhap} onDangXuat={handleDangXuat} />;
  }

  if (vai_tro === 'khach_hang') {
    return <CustomerDashboard nguoiDung={nguoiDungDangNhap} onDangXuat={handleDangXuat} />;
  }

  // Vai trò không xác định
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p>Vai trò không hợp lệ. <button onClick={handleDangXuat}>Đăng xuất</button></p>
    </div>
  );
}

export default App;
```

### Giải thích:

**State trung tâm:**
```javascript
const [nguoiDungDangNhap, setNguoiDungDangNhap] = useState(null);
```
- `null` = chưa đăng nhập → hiện Login
- `{id, email, vai_tro, ho_ten}` = đã đăng nhập → hiện dashboard

**Kiểm tra đã đăng nhập trước đó:**
```javascript
useEffect(() => {
  const duLieu = localStorage.getItem('nguoiDung');
  if (duLieu) setNguoiDungDangNhap(JSON.parse(duLieu));
}, []);
```
- Chạy 1 lần khi app khởi động
- Nếu localStorage có dữ liệu → tự động đăng nhập lại (không cần nhập lại)
- `JSON.parse()`: localStorage lưu string, phải parse lại thành object

**Điều hướng theo vai trò:**
```javascript
if (!nguoiDungDangNhap) return <Login onLogin={handleDangNhapThanhCong} />;

if (vai_tro === 'chu_xuong') return <OwnerDashboard ... />;
if (vai_tro === 'tho_ky_thuat') return <TechnicianDashboard ... />;
// ...
```
- React render component khác nhau tùy trạng thái
- Đây là kỹ thuật "conditional rendering" (render có điều kiện)
- Người dùng không thể truy cập dashboard của vai trò khác

**Truyền `onDangXuat` xuống dashboard:**
- Mỗi dashboard nhận prop `onDangXuat` để có nút "Đăng xuất"
- Khi user nhấn đăng xuất → gọi `handleDangXuat` → xóa localStorage → `nguoiDungDangNhap = null` → React tự render lại trang Login

---

## BƯỚC 12: TẠO DỮ LIỆU MẪU TRONG SUPABASE

**Chạy SQL sau trong Supabase SQL Editor:**

```sql
-- Tạo bảng người dùng (nếu chưa có)
CREATE TABLE IF NOT EXISTS nguoi_dung (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  mat_khau VARCHAR(255) NOT NULL,
  vai_tro VARCHAR(50) NOT NULL,
  ho_ten VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Thêm người dùng mẫu (mật khẩu: "123456" đã được hash bằng bcrypt)
INSERT INTO nguoi_dung (email, mat_khau, vai_tro, ho_ten) VALUES
  ('chuXuong@gara.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'chu_xuong',    'Nguyễn Khánh Nguyên'),
  ('tho@gara.com',        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'tho_ky_thuat', 'Trần Văn Thợ'),
  ('ketoan@gara.com',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ke_toan',      'Lê Thị Kế Toán'),
  ('khachhang@gara.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'khach_hang',   'Phạm Thành Khách');
```

> **Ghi chú**: Hash `$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` là hash của mật khẩu `"password"` (từ thư viện Laravel, tương thích bcrypt). Để tạo hash riêng cho `"123456"`, chạy đoạn code này 1 lần:

```javascript
// Chạy file này 1 lần để tạo hash: node taoHash.js
const bcrypt = require('bcryptjs');
bcrypt.hash('123456', 10).then(hash => console.log(hash));
// Sao chép output và dán vào câu SQL INSERT
```

---

## BƯỚC 13: KIỂM TRA TOÀN BỘ HỆ THỐNG

### Khởi động:
```bash
# Terminal 1: Khởi động server
cd gara/server
npm start
# Kết quả mong đợi:
# 🚀 Server Gara đang chạy tại: http://localhost:5000
# 👉 Kết nối Supabase: THÀNH CÔNG!

# Terminal 2: Khởi động client
cd gara/client
npm start
# Kết quả: Mở http://localhost:3000
```

### Test bằng API client (Postman / Thunder Client):
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "chuXuong@gara.com",
  "mat_khau": "password",
  "vai_tro": "chu_xuong"
}
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "nguoiDung": {
    "id": 1,
    "email": "chuXuong@gara.com",
    "ho_ten": "Nguyễn Khánh Nguyên",
    "vai_tro": "chu_xuong"
  }
}
```

### Các trường hợp kiểm tra:
| Kịch bản | Input | Kết quả mong đợi |
|----------|-------|-----------------|
| Đăng nhập đúng | email+pass+vai_tro đúng | 200 + token |
| Sai mật khẩu | pass sai | 401 "Email hoặc mật khẩu không đúng" |
| Email không tồn tại | email sai | 401 "Email hoặc mật khẩu không đúng" |
| Sai vai trò | vai_tro không khớp | 401 "Vai trò không khớp" |
| Thiếu trường | không có email | 400 "Vui lòng điền đầy đủ..." |

---

## TÓM TẮT CÁC FILE ĐÃ THAY ĐỔI / TẠO MỚI

| File | Thao tác | Mục đích |
|------|----------|----------|
| `server/.env` | Sửa | Thêm `JWT_SECRET` |
| `server/supabase.js` | Tạo mới (nếu chưa có) | Supabase client cho models dùng |
| `server/models/nguoiDungModel.js` | Sửa | Thêm `getByEmail()` |
| `server/controllers/authController.js` | Điền code | Logic xác thực, tạo JWT |
| `server/routes/authRotutes.js` | Điền code | Định nghĩa endpoint `/login` |
| `server/middleware/authMiddleware.js` | Tạo mới | Bảo vệ routes cần xác thực |
| `server/index.js` | Sửa | Đăng ký authRoutes |
| `client/src/services/api.js` | Sửa | Thêm hàm `dangNhap()` |
| `client/src/pages/Login/index.js` | Sửa | Gọi API, xử lý loading/lỗi |
| `client/src/App.js` | Sửa | Điều hướng theo vai trò sau đăng nhập |

---

*Tài liệu này được tạo ngày 2026-05-22 cho dự án Gara Máy Công Trình Khánh Nguyên.*
