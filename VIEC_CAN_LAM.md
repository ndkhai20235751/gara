# Việc cần làm — Hệ thống Gara Khánh Nguyên

## Đã xong
- [x] Cấu trúc project (React + Node.js + Supabase)
- [x] Trang đăng nhập với 4 vai trò (Chủ xưởng, Thợ kỹ thuật, Kế toán, Khách hàng)
- [x] Xác thực JWT + bcrypt
- [x] Dashboard cơ bản cho 4 vai trò
- [x] Nút đăng xuất hoạt động đúng (xóa session, về trang login)
- [x] Mỗi tab trình duyệt độc lập (sessionStorage) — có thể mở nhiều tab với vai trò khác nhau

---

## Cần làm

### Backend (server/)

#### Auth & Bảo mật
- [ ] Middleware xác thực JWT cho các route cần đăng nhập
- [ ] Refresh token (token hết hạn sau 8h không tự gia hạn)
- [ ] Validate input đầu vào (email, mật khẩu) bằng thư viện như `joi` hoặc `express-validator`
- [ ] Rate limiting cho route `/api/auth/login` (chống brute force)
- [ ] Xóa endpoint `/api/fix-passwords` (chỉ dùng 1 lần, nguy hiểm nếu để lại)

#### API theo từng vai trò
- [ ] **Chủ xưởng**: API tiếp nhận yêu cầu, phân công thợ, xem thống kê
- [ ] **Thợ kỹ thuật**: API nhận lệnh, cập nhật trạng thái, gửi phiếu giám định
- [ ] **Kế toán**: API lập báo giá, quản lý công nợ, xuất PDF
- [ ] **Khách hàng**: API gửi yêu cầu, theo dõi tiến độ, phê duyệt báo giá

#### Cơ sở dữ liệu (Supabase)
- [ ] Cấu hình Row Level Security (RLS) cho từng bảng theo vai trò
- [ ] Bảng `phieu_yeu_cau` — yêu cầu sửa chữa
- [ ] Bảng `lenh_sua_chua` — lệnh phân công thợ
- [ ] Bảng `phieu_giam_dinh` — phiếu thợ gửi lên
- [ ] Bảng `bao_gia` — báo giá kế toán lập

---

### Frontend (client/)

#### Chủ xưởng (Owner Dashboard)
- [ ] Danh sách yêu cầu mới chờ xử lý (kết nối API thật)
- [ ] Form phân công thợ kỹ thuật
- [ ] Theo dõi tiến độ theo thời gian thực

#### Thợ kỹ thuật (Technician Dashboard)
- [ ] Danh sách lệnh được phân công (kết nối API thật)
- [ ] Gửi phiếu giám định (form + upload ảnh)
- [ ] Cập nhật trạng thái công việc

#### Kế toán (Accountant Dashboard)
- [ ] Nhận phiếu giám định từ thợ (kết nối API thật)
- [ ] Lập báo giá với dòng chi tiết có thể thêm/sửa/xóa
- [ ] Xuất PDF báo giá thật (thay alert)
- [ ] Quản lý công nợ

#### Khách hàng (Customer Dashboard)
- [ ] Gửi yêu cầu sửa chữa mới (form + upload ảnh máy)
- [ ] Xem tiến độ theo thời gian thực
- [ ] Nhận và phê duyệt báo giá

#### Chung
- [ ] Thông báo real-time (Supabase Realtime hoặc websocket)
- [ ] Upload ảnh máy móc (Supabase Storage)
- [ ] Hiển thị tên và thông tin người dùng đúng từ DB (hiện đang hardcode)
- [ ] Xử lý token hết hạn: tự động redirect về trang login
- [ ] Trang 404 / lỗi khi vai trò không hợp lệ

---

## Ghi chú kỹ thuật
- `sessionStorage` thay `localStorage` → mỗi tab trình duyệt có thể đăng nhập khác vai trò
- Token JWT hết hạn sau **8 giờ** — cần middleware kiểm tra phía backend và redirect phía frontend
- File `.env` cần có: `PORT`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
