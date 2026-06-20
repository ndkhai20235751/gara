const KhachHangModel = require('../models/khachHangModel');
const { supabase } = require('../config/superbase');

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
  // POST /api/khach-hang/yeu-cau/:mayeucau/nghiem-thu — Khách xác nhận nghiệm thu
  xacNhanNghiemThu: async (req, res) => {
    try {
      const { mayeucau } = req.params;
      const makhachhang = req.nguoiDung.makhachhang;

      // Kiểm tra yêu cầu thuộc khách hàng này và đã hoàn thành
      const { data: pyc } = await supabase
        .from('phieu_yeu_cau')
        .select('makhachhang, trangthai')
        .eq('mayeucau', mayeucau)
        .maybeSingle();

      if (!pyc) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
      if (pyc.makhachhang !== makhachhang) return res.status(403).json({ success: false, message: 'Không có quyền' });
      if (pyc.trangthai !== 'Hoàn thành') return res.status(400).json({ success: false, message: 'Yêu cầu chưa hoàn thành' });

      // Tìm malenh để tạo biên bản nghiệm thu
      const { data: lenh } = await supabase
        .from('lenh_sua_chua')
        .select('malenh')
        .eq('mayeucau', mayeucau)
        .maybeSingle();

      if (lenh?.malenh) {
        await supabase.from('nghiem_thu').insert([{
          malenh:             lenh.malenh,
          thoigianhoanthanh:  new Date().toISOString(),
          nguoixacnhan:       req.nguoiDung.email || 'Khách hàng',
          ghichu:             'Khách hàng xác nhận hoàn thành sửa chữa qua cổng thông tin',
        }]);
      }

      // Cập nhật trạng thái phiếu yêu cầu
      await supabase
        .from('phieu_yeu_cau')
        .update({ trangthai: 'Khách đã nghiệm thu' })
        .eq('mayeucau', mayeucau);

      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = khachHangController;
