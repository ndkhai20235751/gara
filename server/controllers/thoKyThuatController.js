const { supabase } = require('../config/superbase');
const ThoKyThuatModel = require('../models/thoModel');
const LenhSuaChuaModel = require('../models/lenhSuaChuaModel');
const PhieuBaoKhamModel = require('../models/phieuBaoKhamModel');
const { emit } = require('../utils/socket');

const thoKyThuatController = {

  // GET /api/tho/debug — Kiểm tra dữ liệu thô, dùng để debug
  debugTho: async (req, res) => {
    try {
      const manguoidung = req.nguoiDung.id;

      // Bước 1: tìm hồ sơ thợ
      const tho = await ThoKyThuatModel.getByMaNguoiDung(manguoidung);

      // Bước 2: lấy toàn bộ lenh_sua_chua (không join) của thợ này
      let lenhTho = null;
      let lenhError = null;
      if (tho) {
        const { data, error } = await supabase
          .from('lenh_sua_chua')
          .select('*')
          .eq('matho', tho.matho);
        lenhTho = data;
        lenhError = error?.message || null;
      }

      // Bước 3: lấy toàn bộ lenh_sua_chua trong DB (không lọc)
      const { data: tatCaLenh } = await supabase.from('lenh_sua_chua').select('*');

      return res.json({
        manguoidung_token: manguoidung,
        tho_profile: tho,
        lenh_cua_tho: lenhTho,
        lenh_error: lenhError,
        tat_ca_lenh_trong_db: tatCaLenh,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/tho/lenh — Lấy các lệnh được phân công cho thợ đang đăng nhập
  layLenhCuaTho: async (req, res) => {
    try {
      const tho = await ThoKyThuatModel.getByMaNguoiDung(req.nguoiDung.id);
      if (!tho) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy hồ sơ thợ kỹ thuật (manguoidung=${req.nguoiDung.id})`,
        });
      }

      // Lấy lenh không join trước để kiểm tra dữ liệu thô
      const { data: lenhTho, error: lenhErr } = await supabase
        .from('lenh_sua_chua')
        .select('*')
        .eq('matho', tho.matho);

      if (lenhErr) throw lenhErr;

      // Nếu không có lệnh nào, trả về sớm (tránh lỗi join)
      if (!lenhTho || lenhTho.length === 0) {
        return res.json({ success: true, danhSach: [], thoInfo: tho });
      }

      // Lấy thêm thông tin join phieu_yeu_cau + khach_hang
      const mayeucauList = lenhTho.map((l) => l.mayeucau).filter(Boolean);
      const { data: phieuList } = await supabase
        .from('phieu_yeu_cau')
        .select('*, khach_hang(tencongty, sodienthoai)')
        .in('mayeucau', mayeucauList);

      // Gắn phieu_yeu_cau vào từng lệnh
      const phieuMap = {};
      (phieuList || []).forEach((p) => { phieuMap[p.mayeucau] = p; });

      const danhSach = lenhTho
        .map((l) => ({ ...l, phieu_yeu_cau: phieuMap[l.mayeucau] || null }))
        .sort((a, b) => new Date(b.thoigianphancong || 0) - new Date(a.thoigianphancong || 0));

      return res.json({ success: true, danhSach, thoInfo: tho });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/tho/lenh/:malenh/nhan — Xác nhận nhận lệnh
  nhanLenh: async (req, res) => {
    try {
      const { malenh } = req.params;
      await LenhSuaChuaModel.updateTrangThai(malenh, 'Đã nhận lệnh');
      emit('lenh_thay_doi');
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/tho/lenh/:malenh/den — Xác nhận đã đến hiện trường
  denHienTruong: async (req, res) => {
    try {
      const { malenh } = req.params;
      await LenhSuaChuaModel.updateTrangThai(malenh, 'Đã đến hiện trường');

      // Cập nhật trạng thái phiếu yêu cầu sang "Đang kiểm tra"
      const lenh = await LenhSuaChuaModel.getByMalenh(malenh);
      if (lenh?.mayeucau) {
        await supabase
          .from('phieu_yeu_cau')
          .update({ trangthai: 'Đang kiểm tra' })
          .eq('mayeucau', lenh.mayeucau);
      }

      emit('lenh_thay_doi');
      emit('yeu_cau_thay_doi');
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/tho/phieu-bao-kham — Nộp phiếu giám định
  nopPhieuGiamDinh: async (req, res) => {
    try {
      const { malenh, mayeucau, sogiodongho, chandoan, phutung, giocong, ghichu } = req.body;
      if (!mayeucau || !chandoan) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin phiếu giám định' });
      }

      const tho = await ThoKyThuatModel.getByMaNguoiDung(req.nguoiDung.id);
      if (!tho) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ thợ' });
      }

      const noiDung = [
        `Số giờ đồng hồ: ${sogiodongho || 'N/A'}`,
        `Chẩn đoán: ${chandoan}`,
        `Phụ tùng cần thay: ${phutung || 'N/A'}`,
        `Giờ công dự kiến: ${giocong || 'N/A'}`,
        `Ghi chú: ${ghichu || ''}`,
      ].join('\n');

      const phieu = await PhieuBaoKhamModel.create({
        malenh:      malenh || null,
        motachitiet: noiDung,
        thoigianlap: new Date().toISOString(),
      });

      // Cập nhật trạng thái lệnh & phiếu yêu cầu
      if (malenh) {
        await LenhSuaChuaModel.updateTrangThai(malenh, 'Đã nộp phiếu');
      }
      await supabase
        .from('phieu_yeu_cau')
        .update({ trangthai: 'Chờ báo giá' })
        .eq('mayeucau', mayeucau);

      emit('lenh_thay_doi');
      emit('yeu_cau_thay_doi');
      return res.status(201).json({ success: true, phieu });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/tho/lenh/:malenh/hoan-thanh — Hoàn thành sửa chữa
  hoanThanhSuaChua: async (req, res) => {
    try {
      const { malenh } = req.params;
      await LenhSuaChuaModel.updateTrangThai(malenh, 'Hoàn thành');

      const lenh = await LenhSuaChuaModel.getByMalenh(malenh);
      if (lenh?.mayeucau) {
        await supabase
          .from('phieu_yeu_cau')
          .update({ trangthai: 'Hoàn thành' })
          .eq('mayeucau', lenh.mayeucau);
      }

      emit('lenh_thay_doi');
      emit('yeu_cau_thay_doi');
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // PATCH /api/tho/lenh/:malenh/bat-dau — Bắt đầu sửa chữa sau khi khách duyệt báo giá
  batDauSuaChua: async (req, res) => {
    try {
      const { malenh } = req.params;
      await LenhSuaChuaModel.updateTrangThai(malenh, 'Đang sửa chữa');

      const lenh = await LenhSuaChuaModel.getByMalenh(malenh);
      if (lenh?.mayeucau) {
        await supabase
          .from('phieu_yeu_cau')
          .update({ trangthai: 'Đang sửa chữa' })
          .eq('mayeucau', lenh.mayeucau);
      }

      emit('lenh_thay_doi');
      emit('yeu_cau_thay_doi');
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = thoKyThuatController;
