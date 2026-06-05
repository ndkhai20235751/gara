const ThongBaoModel = require('../models/thongBaoModel');

const thongBaoController = {
  // GET /api/thong-bao - Lấy danh sách thông báo
  layThongBao: async (req, res) => {
    try {
      const thongBao = await ThongBaoModel.getThongBao();
      const soChuaDoc = await ThongBaoModel.demChuaDoc();
      return res.json({ success: true, thongBao, soChuaDoc });
    } catch (err) {
      console.error('Lỗi layThongBao:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // PUT /api/thong-bao/:mathongbao/doc - Đánh dấu đã đọc
  danhDauDaDoc: async (req, res) => {
    try {
      const { mathongbao } = req.params;
      const result = await ThongBaoModel.danhDauDaDoc(mathongbao);
      return res.json({ success: true, message: 'Đã đánh dấu đã đọc', thongBao: result });
    } catch (err) {
      console.error('Lỗi danhDauDaDoc:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/thong-bao/chi-tiet/:mabaogia - Lấy chi tiết báo giá cần điều chỉnh
  layChiTietBaoGia: async (req, res) => {
    try {
      const { mabaogia } = req.params;
      const chiTiet = await ThongBaoModel.getChiTietBaoGiaDieuChinh(mabaogia);
      if (!chiTiet) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy báo giá' });
      }
      return res.json({ success: true, chiTiet });
    } catch (err) {
      console.error('Lỗi layChiTietBaoGia:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = thongBaoController;
