const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NguoiDungModel  = require('../models/nguoiDungModel');
const KhachHangModel  = require('../models/khachHangModel');
const ChuXuongModel   = require('../models/chuXuongModel');
const ThoKyThuatModel = require('../models/thoModel');
const KeToanModel     = require('../models/keToanModel');



const authController ={
    dangNhap : async (req,res)=>{
        try{
            const {email,matkhau,vaitro} =req.body;
            console.log('===== LOGIN =====');
            console.log('email:', email, '| vaitro:', vaitro);

            if(!email||!matkhau||!vaitro){
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ email, mật khẩu và vai trò'
                });
            }
            const nguoiDung=await NguoiDungModel.getByEmail(email);
            console.log('Tìm user:', nguoiDung ? 'CÓ' : 'KHÔNG CÓ');
            if(!nguoiDung){
                return res.status(401).json({
                    success:false,
                    message: 'Email hoặc mật khẩu không đúng',
                });
            }

            console.log('vaitro DB:', nguoiDung.vaitro, '| khớp:', nguoiDung.vaitro === vaitro);
            if(nguoiDung.vaitro !== vaitro){
                return res.status(401).json({
                   success: false,
                   message: 'Vai trò không khớp với tài khoản này',
                });
            }

            const laHash = nguoiDung.matkhau && nguoiDung.matkhau.startsWith('$2');
            console.log('matkhau nhập vào :', matkhau);
            console.log('matkhau trong DB :', nguoiDung.matkhau);
            console.log('Đã hash:', laHash);

            let matKhauHopLe = false;
            if(laHash){
                matKhauHopLe = await bcrypt.compare(matkhau, nguoiDung.matkhau);
            } else {
                matKhauHopLe = (matkhau === nguoiDung.matkhau);
                if(matKhauHopLe){
                    const hash = await bcrypt.hash(matkhau, 10);
                    await NguoiDungModel.update(nguoiDung.manguoidung, { matkhau: hash });
                }
            }
            console.log('Mật khẩu hợp lệ:', matKhauHopLe);
            if(!matKhauHopLe){
                return res.status(401).json({
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng',
                })
            }
            let makhachhang = null;
            if (nguoiDung.vaitro === 'khachhang') {
                const kh = await KhachHangModel.getByMaNguoiDung(nguoiDung.manguoidung);
                makhachhang = kh?.makhachhang || null;
            }

            const token=jwt.sign(
                {
                    id:nguoiDung.manguoidung,
                    email:nguoiDung.email,
                    vaitro:nguoiDung.vaitro,
                    makhachhang,
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );
            return res.status(200).json({
                success:true,
                message:'Đăng nhập thành công',
                token:token,
                nguoiDung:{
                     id: nguoiDung.manguoidung,
                     email: nguoiDung.email,
                     ho_ten: nguoiDung.tendangnhap,
                     vai_tro: nguoiDung.vaitro,
                }
            });
        }
    
    catch(error){
     console.error('Lỗi đăng nhập:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống, vui lòng thử lại',
      });
    }
    },
    dangKy: async (req, res) => {
        try {
            const { hoten, sodienthoai, email, matkhau, vaitro } = req.body;

            const VAITRO_HOP_LE = ['khachhang', 'chuxuong', 'thokythuat', 'ketoan'];
            if (!hoten || !sodienthoai || !email || !matkhau || !vaitro) {
                return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
            }
            if (!VAITRO_HOP_LE.includes(vaitro)) {
                return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
            }

            const nguoiDungCu = await NguoiDungModel.getByEmail(email);
            if (nguoiDungCu) {
                return res.status(409).json({ success: false, message: 'Email này đã được đăng ký' });
            }

            const hash = await bcrypt.hash(matkhau, 10);

            const nguoiDungMoi = await NguoiDungModel.create({
                tendangnhap: hoten,
                matkhau: hash,
                vaitro,
                trangthaitaikhoan: 'true',
                email,
            });

            // Tạo hồ sơ trong bảng riêng theo từng vai trò
            const manguoidung = nguoiDungMoi.manguoidung;
            if (vaitro === 'khachhang') {
                await KhachHangModel.create({
                    manguoidung,
                    tencongty: hoten,
                    sodienthoai,
                    email,
                    diachi: '',
                });
            } else if (vaitro === 'chuxuong') {
                await ChuXuongModel.create({
                    manguoidung,
                    hoten,
                    sodienthoai,
                    email,
                });
            } else if (vaitro === 'thokythuat') {
                await ThoKyThuatModel.create({
                    manguoidung,
                    hoten,
                    sodienthoai,
                    vitrihientai: '',
                    trangthai: 'Rảnh',
                });
            } else if (vaitro === 'ketoan') {
                await KeToanModel.create({
                    manguoidung,
                    hoten,
                    sodienthoai,
                    email,
                });
            }

            return res.status(201).json({ success: true, message: 'Đăng ký thành công' });
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message });
        }
    },
};
module.exports=authController;