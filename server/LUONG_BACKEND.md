# Luồng Hoạt Động Backend - Gara

## 1. Luồng Khởi Động Server

```
┌─────────────────────────────────────────────────────────────┐
│                        index.js                             │
│                                                             │
│  [1] require('dotenv').config()                             │
│       └─► Đọc file .env → nạp PORT, SUPABASE_URL,          │
│                            SUPABASE_SERVICE_ROLE_KEY        │
│                                                             │
│  [2] require('./config/superbase')                          │
│       └─► Tạo Supabase Client                               │
│       └─► kiemTraKetNoiSupabase() → listBuckets()           │
│            ├─ Thành công: "✅ Kết nối Supabase: THÀNH CÔNG" │
│            └─ Thất bại:  "❌ Kết nối Supabase: THẤT BẠI"   │
│                                                             │
│  [3] app.use(cors({ origin: 'http://localhost:3000' }))     │
│       └─► Chỉ cho phép React gọi vào                        │
│                                                             │
│  [4] app.use(express.json())                                │
│       └─► Cho phép đọc body dạng JSON                       │
│                                                             │
│  [5] app.listen(5000)                                       │
│       └─► "🚀 Server đang chạy tại http://localhost:5000"   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Luồng Xử Lý Request (MVC Pattern)

```
CLIENT (React :3000)
        │
        │  HTTP Request (GET / POST / PUT / DELETE)
        ▼
┌───────────────┐
│  CORS Middleware │  ← Kiểm tra origin có phải localhost:3000 không
└───────┬───────┘
        │ Hợp lệ
        ▼
┌───────────────┐
│ JSON Middleware │  ← Parse body thành req.body
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    ROUTES     │  ← routes/ khớp URL với Controller
│  routes/*.js  │    VD: GET /api/data → dataController.getData
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  CONTROLLERS  │  ← Xử lý logic nghiệp vụ
│controllers/*.js│   Nhận req, gọi Model, trả res
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    MODELS     │  ← Giao tiếp với Supabase (Database)
│  models/*.js  │    VD: supabase.from('xe').select('*')
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   SUPABASE    │  ← PostgreSQL Database trên cloud
│  (Database)   │
└───────┬───────┘
        │  Dữ liệu trả về
        ▼
CLIENT nhận JSON Response
```

---

## 3. Cấu Trúc Thư Mục Hiện Tại

```
server/
├── index.js                ← Điểm khởi động, cấu hình Express
├── .env                    ← Biến môi trường (PORT, SUPABASE_*)
├── package.json
│
├── config/
│   └── superbase.js        ← Khởi tạo Supabase Client
│
├── routes/          (trống) ← Định nghĩa đường dẫn API
├── controllers/     (trống) ← Logic xử lý request
└── models/          (trống) ← Truy vấn database
```

---

## 4. Luồng Dữ Liệu Cụ Thể (Ví dụ: Lấy danh sách xe)

```
GET /api/xe
     │
     ├─► routes/xe.js         → router.get('/', xeController.getAll)
     │
     ├─► controllers/xeController.js
     │       const danhSachXe = await XeModel.getAll()
     │       res.json(danhSachXe)
     │
     ├─► models/xeModel.js
     │       supabase.from('xe').select('*')
     │
     └─► Supabase → trả về [{id, bienSo, ...}, ...]
```

---

## 5. Biến Môi Trường (.env)

| Biến                      | Giá trị              | Dùng ở đâu            |
|---------------------------|----------------------|-----------------------|
| `PORT`                    | `5000`               | index.js              |
| `SUPABASE_URL`            | https://...supabase.co | config/superbase.js |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...`    | config/superbase.js   |

---

## 6. Thứ Tự Tạo File Khi Mở Rộng

```
Bước 1: models/tenModel.js       ← Viết trước (tầng data)
Bước 2: controllers/tenCtrl.js   ← Dùng model ở trên
Bước 3: routes/tenRoute.js       ← Gắn controller vào URL
Bước 4: index.js                 ← app.use('/api/ten', tenRoute)
```
