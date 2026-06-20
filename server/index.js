
require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { setIO } = require('./utils/socket');

const app = express();
const server = http.createServer(app);

// Định nghĩa PORT và có thêm cổng 5000 dự phòng nếu file .env bị lỗi
const port = process.env.PORT ;

const superbases=require('./config/superbase');
superbases.kiemTraKetNoiSupabase();

// Socket.io
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});
setIO(io);
io.on('connection', (socket) => {
  console.log('🔌 Client kết nối:', socket.id);
  socket.on('disconnect', () => console.log('🔌 Client ngắt kết nối:', socket.id));
});

// 3. CÁC MIDDLEWARE CỦA EXPRESS (Nên đặt trước các Route API)
app.use(cors({
  origin: 'http://localhost:3000' // Chỉ cho phép React ở port 3000 gọi vào
}));
app.use(express.json());

//routes
const authRoutes=require('./routes/authRotutes');
app.use('/api/auth',authRoutes);


const phieuYeuCauRoutes = require('./routes/phieuYeuCauRoutes');
app.use('/api/phieu-yeu-cau', phieuYeuCauRoutes);

const chuXuongRoutes = require('./routes/chuXuongRoutes');
app.use('/api/chu-xuong', chuXuongRoutes);

const thoKyThuatRoutes = require('./routes/thoKyThuatRoutes');
app.use('/api/tho', thoKyThuatRoutes);

const keToanRoutes = require('./routes/keToanRoutes');
app.use('/api/ke-toan', keToanRoutes);

const khachHangRoutes = require('./routes/khachHangRoutes');
app.use('/api/khach-hang', khachHangRoutes);

const thongBaoRoutes = require('./routes/thongBaoRoutes');
app.use('/api/thong-bao', thongBaoRoutes);


// 4. CÁC ĐƯỜNG DẪN API (ROUTES)
app.get('/api/data', (req, res) => {
    res.json({ message: "Xin chào từ Backend Node.js!" });
});






// ENDPOINT SỬA MẬT KHẨU PLAINTEXT (dùng 1 lần rồi xóa)
app.get('/api/fix-passwords', async (req, res) => {
    const bcrypt = require('bcryptjs');
    const { supabase } = require('./config/superbase');
    const { data: users, error } = await supabase.from('nguoi_dung').select('*');
    if (error) return res.status(500).json({ message: 'Lỗi lấy danh sách', error: error.message });

    const ketQua = [];
    for (const user of users) {
        const daHash = user.matkhau && user.matkhau.startsWith('$2');
        if (daHash) {
            ketQua.push({ email: user.email, trangThai: 'Đã hash sẵn, bỏ qua' });
            continue;
        }
        const hash = await bcrypt.hash(user.matkhau, 10);
        const { error: err } = await supabase.from('nguoi_dung').update({ matkhau: hash }).eq('manguoidung', user.manguoidung);
        ketQua.push({ email: user.email, trangThai: err ? 'LỖI: ' + err.message : '✅ Đã hash thành công' });
    }
    res.json({ ketQua });
});

// 5. KHỞI ĐỘNG SERVER
server.listen(port, () => {
  console.log(`🚀 Server Gara đang chạy mượt mà tại cổng: http://localhost:${port}`);
});

//câu lệnh tắt hoàn toàn các tiến trình: taskkill /F /IM node.exe