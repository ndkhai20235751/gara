const { supabase } = require('../config/superbase');
const LenhSuaChuaModel = require('../models/lenhSuaChuaModel');
const ThoKyThuatModel = require('../models/thoModel');
const ChuXuongModel = require('../models/chuXuongModel');
const PhieuBaoGiaModel = require('../models/phieuBaoGiaModel');
const { guiBaoGiaKhachHang } = require('../services/emailService');

const chuXuongController = {

  // GET /api/chu-xuong/yeu-cau — Tất cả phiếu yêu cầu kèm thông tin khách hàng
  layTatCaYeuCau: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('phieu_yeu_cau')
        .select('*, khach_hang(tencongty, sodienthoai, email)')
        .order('thoigiangui', { ascending: false });
      if (error) throw error;
      return res.json({ success: true, danhSach: data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/chu-xuong/danh-sach-tho — Danh sách thợ kỹ thuật
  layDanhSachTho: async (req, res) => {
    try {
      const danhSach = await ThoKyThuatModel.getAll();
      return res.json({ success: true, danhSach });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/chu-xuong/duyet — Duyệt & phân công thợ, tạo lệnh sửa chữa
  duyetVaPhanCong: async (req, res) => {
    try {
      const { mayeucau, matho, mucdouutien } = req.body;
      if (!mayeucau || !matho) {
        return res.status(400).json({ success: false, message: 'Thiếu mayeucau hoặc matho' });
      }

      let chuXuong = await ChuXuongModel.getByMaNguoiDung(req.nguoiDung.id);
      if (!chuXuong) {
        const { data: nd } = await supabase
          .from('nguoi_dung')
          .select('tendangnhap, sodienthoai, email')
          .eq('manguoidung', req.nguoiDung.id)
          .maybeSingle();
        if (!nd) {
          return res.status(400).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
        }
        chuXuong = await ChuXuongModel.create({
          manguoidung: req.nguoiDung.id,
          hoten: nd.tendangnhap || 'Chủ xưởng',
          sodienthoai: nd.sodienthoai || '',
          email: nd.email || '',
        });
      }

      const { error: e1 } = await supabase
        .from('phieu_yeu_cau')
        .update({ trangthai: 'Đã phân công' })
        .eq('mayeucau', mayeucau);
      if (e1) throw e1;

      const lenh = await LenhSuaChuaModel.create({
        mayeucau,
        matho,
        machuxuong: chuXuong.machuxuong,
        thoigianphancong: new Date().toISOString(),
        mucdouutien: mucdouutien || 'Trung bình',
        trangthai: 'Chờ nhận',
      });

      return res.status(201).json({ success: true, lenh });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/chu-xuong/tuchoi/:mayeucau — Từ chối yêu cầu
  tuChoi: async (req, res) => {
    try {
      const { mayeucau } = req.params;
      const { error } = await supabase
        .from('phieu_yeu_cau')
        .update({ trangthai: 'Từ chối' })
        .eq('mayeucau', mayeucau);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/chu-xuong/lenh — Tất cả lệnh sửa chữa kèm thợ và khách hàng
  layTatCaLenh: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('lenh_sua_chua')
        .select(`
          *,
          tho_ky_thuat(hoten, sodienthoai, vitrihientai),
          phieu_yeu_cau(mayeucau, modelmay, vitricongtruong, motaloi, thoigiangui,
            khach_hang(tencongty, sodienthoai))
        `)
        .order('thoigianphancong', { ascending: false });
      if (error) throw error;
      return res.json({ success: true, danhSach: data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/chu-xuong/cap-nhat/:mayeucau — Cập nhật trạng thái tiến độ
  capNhatTrangThai: async (req, res) => {
    try {
      const { mayeucau } = req.params;
      const { trangthai } = req.body;
      const { error } = await supabase
        .from('phieu_yeu_cau')
        .update({ trangthai })
        .eq('mayeucau', mayeucau);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/chu-xuong/bao-gia — Danh sách phiếu báo giá chờ phê duyệt
  layBaoGia: async (req, res) => {
    try {
      const danhSach = await PhieuBaoGiaModel.getAllWithJoin();
      return res.json({ success: true, danhSach });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/chu-xuong/bao-gia/:mabaogia — Chi tiết báo giá kèm noidung
  layChiTietBaoGia: async (req, res) => {
    try {
      const { mabaogia } = req.params;
      const chiTiet = await PhieuBaoGiaModel.getById(mabaogia);
      if (!chiTiet) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy báo giá' });
      }
      // Đưa dữ liệu báo giá vào phieu_bao_gia để tương thích với BaoGia component
      const phieu = {
        mabaokham: chiTiet.phieu_bao_kham?.mabaokham,
        phieu_bao_gia: chiTiet,
        lenh_sua_chua: chiTiet.phieu_bao_kham?.lenh_sua_chua,
      };
      return res.json({ success: true, chiTiet: phieu });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/chu-xuong/bao-gia/:mabaogia — Sửa chi phí báo giá
  suaBaoGia: async (req, res) => {
    try {
      const { mabaogia } = req.params;
      const { chiphinhancong, chiphiphutung, chiphikhac, tongcong, noidung, tendonvi, diachidonvi, sodienthoaidonvi } = req.body;
      const updated = await PhieuBaoGiaModel.updateChiPhi(mabaogia, {
        chiphinhancong: Number(chiphinhancong) || 0,
        chiphiphutung:  Number(chiphiphutung)  || 0,
        chiphikhac:     Number(chiphikhac)     || 0,
        tongcong:       Number(tongcong)        || 0,
        ...(noidung !== undefined && { noidung }),
        ...(tendonvi !== undefined && { tendonvi }),
        ...(diachidonvi !== undefined && { diachidonvi }),
        ...(sodienthoaidonvi !== undefined && { sodienthoaidonvi }),
      });
      return res.json({ success: true, baogia: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/chu-xuong/bao-gia/:mabaogia/duyet — Phê duyệt & gửi khách hàng
  duyetVaGuiKhach: async (req, res) => {
    try {
      const { mabaogia } = req.params;

      // Cập nhật trạng thái phiếu báo giá
      const baoGia = await PhieuBaoGiaModel.updateStatus(mabaogia, 'Đã gửi khách');

      // Tìm mayeucau qua chuỗi: phieu_bao_kham → lenh_sua_chua → phieu_yeu_cau
      const { data: pbk } = await supabase
        .from('phieu_bao_kham')
        .select('malenh')
        .eq('mabaokham', baoGia.mabaokham)
        .maybeSingle();

      if (pbk?.malenh) {
        const { data: lenh } = await supabase
          .from('lenh_sua_chua')
          .select('mayeucau')
          .eq('malenh', pbk.malenh)
          .maybeSingle();

        if (lenh?.mayeucau) {
          await supabase
            .from('phieu_yeu_cau')
            .update({ trangthai: 'Chờ khách duyệt' })
            .eq('mayeucau', lenh.mayeucau);
        }
      }

      return res.json({ success: true, baogia: baoGia });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = chuXuongController;
