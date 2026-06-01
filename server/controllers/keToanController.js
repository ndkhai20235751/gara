const { supabase } = require('../config/superbase');
const PhieuBaoKhamModel = require('../models/phieuBaoKhamModel');
const KeToanModel = require('../models/keToanModel');

const keToanController = {

  // GET /api/ke-toan/phieu-bao-kham — Danh sách phiếu giám định chờ báo giá
  layPhieuChoBaoGia: async (req, res) => {
    try {
      const danhSach = await PhieuBaoKhamModel.getAllWithJoin();
      return res.json({ success: true, danhSach });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/ke-toan/phieu-bao-gia — Tạo báo giá từ phiếu giám định
  taoBaoGia: async (req, res) => {
    try {
      const { mabaokham, mayeucau, chiphinhancong, chiphiphutung, chiphikhac, tongcong, noidung } = req.body;
      if (!mayeucau) {
        return res.status(400).json({ success: false, message: 'Thiếu mayeucau' });
      }

      // Lấy hồ sơ kế toán — tự động tạo nếu chưa có
      let keToan = await KeToanModel.getByMaNguoiDung(req.nguoiDung.id);
      if (!keToan) {
        const { data: nd } = await supabase
          .from('nguoi_dung')
          .select('tendangnhap, sodienthoai, email')
          .eq('manguoidung', req.nguoiDung.id)
          .maybeSingle();
        keToan = await KeToanModel.create({
          manguoidung: req.nguoiDung.id,
          hoten:       nd?.tendangnhap || 'Kế toán',
          sodienthoai: nd?.sodienthoai || '',
          email:       nd?.email       || '',
        });
      }

      const { data, error } = await supabase
        .from('phieu_bao_gia')
        .insert([{
          mabaokham:         mabaokham ?? null,
          maketoan:          keToan?.maketoan ?? null,
          tendonvi:          'Máy Công Trình Khánh Nguyên',
          diachidonvi:       'Số 629, Tổ 36, Phường Cự Khối, Quận Long Biên, Hà Nội',
          sodienthoaidonvi:  '0862892021',
          chiphinhancong:    Number(chiphinhancong) || 0,
          chiphiphutung:     Number(chiphiphutung)  || 0,
          chiphikhac:        Number(chiphikhac)     || 0,
          tongcong:          Number(tongcong)        || 0,
          hieuluc:           '7 ngày',
          trangthai:         'Chờ phê duyệt',
          thoigianlap:       new Date().toISOString(),
          thoigiandapung:    new Date().toISOString(),
          noidung:           noidung || null,
        }])
        .select();
      if (error) throw error;

      // Cập nhật trạng thái phiếu yêu cầu
      await supabase
        .from('phieu_yeu_cau')
        .update({ trangthai: 'Đã báo giá' })
        .eq('mayeucau', mayeucau);

      return res.status(201).json({ success: true, baogia: data[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = keToanController;
