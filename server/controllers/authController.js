const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NguoiDungModel = require('../models/nguoiDungModel');



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
            const token=jwt.sign(
                {
                    id:nguoiDung.manguoidung,
                    email:nguoiDung.email,
                    vaitro:nguoiDung.vaitro,
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
};
module.exports=authController;