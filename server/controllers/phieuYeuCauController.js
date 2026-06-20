const PhieuYeuCauModel=require('../models/phieuYeuCauModel');
const KhachHangModel=require('../models/khachHangModel');

const layMaKhachHang = async (nguoiDungToken) => {
  if (nguoiDungToken.makhachhang) return nguoiDungToken.makhachhang;
  // fallback: tra cứu khach_hang theo manguoidung
  const kh = await KhachHangModel.getByMaNguoiDung(nguoiDungToken.id);
  return kh?.makhachhang || null;
};

const phieuYeuCauController = {

  // POST /api/phieu-yeu-cau — Khách hàng gửi phiếu mới
  taoPhieu: async (req, res) => {
    try {
      const { modelmay, vitricongtruong, nguoilienhe, sodienthoai, motaloi } = req.body;
      const makhachhang = await layMaKhachHang(req.nguoiDung);

      if (!makhachhang) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản không liên kết với khách hàng. Vui lòng liên hệ quản lý.',
        });
      }

      if (!modelmay || !vitricongtruong || !sodienthoai || !motaloi) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin',
        });
      }

      const phieu = await PhieuYeuCauModel.create({
        makhachhang,
        modelmay,
        vitricongtruong,
        nguoilienhe: nguoilienhe || '',
        sodienthoai,
        motaloi,
        trangthai: 'Chờ tiếp nhận',
        thoigiangui: new Date().toISOString(),
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
      const makhachhang = await layMaKhachHang(req.nguoiDung);
      const danhSach = await PhieuYeuCauModel.getByKhachHang(makhachhang);
      return res.status(200).json({ success: true, danhSach });
    } catch (error) {
      console.error('Lỗi lấy danh sách:', error.message);
      return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message });
    }
  },

};


module.exports=phieuYeuCauController;