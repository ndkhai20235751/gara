const KhachHangModel = require('../models/khachHangModel');

const khachHangController = {
  // GET /api/khach-hang/bao-gia - Lấy danh sách báo giá của khách hàng
  layBaoGia: async (req, res) => {
    try {
      const makhachhang = req.nguoiDung.makhachhang;
      if (!makhachhang) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy mã khách hàng' });
      }

      const danhSach = await KhachHangModel.getBaoGiaChoKhach(makhachhang);
      return res.json({ success: true, danhSach });
    } catch (err) {
      console.error('Lỗi layBaoGia:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/khach-hang/bao-gia/:mabaogia - Lấy chi tiết báo giá
  layChiTietBaoGia: async (req, res) => {
    try {
      const { mabaogia } = req.params;
      const makhachhang = req.nguoiDung.makhachhang;

      if (!makhachhang) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy mã khách hàng' });
      }

      const chiTiet = await KhachHangModel.getChiTietBaoGia(mabaogia, makhachhang);
      if (!chiTiet) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy báo giá' });
      }

      // Transform data cho frontend
      const phieu = {
        mabaokham: chiTiet.phieu_bao_kham?.mabaokham,
        phieu_bao_gia: chiTiet,
        lenh_sua_chua: chiTiet.phieu_bao_kham?.lenh_sua_chua,
      };

      return res.json({ success: true, chiTiet: phieu });
    } catch (err) {
      console.error('Lỗi layChiTietBaoGia:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/khach-hang/bao-gia/:mabaogia/duyet - Phê duyệt báo giá
  pheDuyetBaoGia: async (req, res) => {
    try {
      const { mabaogia } = req.params;
      const makhachhang = req.nguoiDung.makhachhang;

      // Kiểm tra báo giá thuộc về khách hàng
      const chiTiet = await KhachHangModel.getChiTietBaoGia(mabaogia, makhachhang);
      if (!chiTiet) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy báo giá' });
      }

      const result = await KhachHangModel.pheDuyetBaoGia(mabaogia);
      return res.json({ success: true, message: 'Đã phê duyệt báo giá', baogia: result });
    } catch (err) {
      console.error('Lỗi pheDuyetBaoGia:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/khach-hang/bao-gia/:mabaogia/dieu-chinh - Yêu cầu điều chỉnh
  yeuCauDieuChinh: async (req, res) => {
    try {
      const { mabaogia } = req.params;
      const { lydo } = req.body;
      const makhachhang = req.nguoiDung.makhachhang;

      if (!lydo || !lydo.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do điều chỉnh' });
      }

      // Kiểm tra báo giá thuộc về khách hàng
      const chiTiet = await KhachHangModel.getChiTietBaoGia(mabaogia, makhachhang);
      if (!chiTiet) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy báo giá' });
      }

      const result = await KhachHangModel.yeuCauDieuChinh(mabaogia, lydo);
      return res.json({ success: true, message: 'Đã gửi yêu cầu điều chỉnh', baogia: result });
    } catch (err) {
      console.error('Lỗi yeuCauDieuChinh:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = khachHangController;
