const { supabase } = require('../config/superbase');
const PhieuBaoKhamModel = require('../models/phieuBaoKhamModel');
const KeToanModel = require('../models/keToanModel');
const { emit } = require('../utils/socket');

const keToanController = {

  // GET /api/ke-toan/phieu-bao-kham — Danh sách phiếu giám định chờ báo giá
  layPhieuChoBaoGia: async (req, res) => {
    try {
      const danhSach = await PhieuBaoKhamModel.getAllWithJoin();
      return res.json({ success: true, danhSach });
    } catch (err) {
      console.error('Lỗi layPhieuChoBaoGia:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/ke-toan/yeu-cau-dieu-chinh — Lấy báo giá cần điều chỉnh
  layYeuCauDieuChinh: async (req, res) => {
    try {
      // Lấy các báo giá có trạng thái "Khách yêu cầu điều chỉnh"
      const { data, error } = await supabase
        .from('phieu_bao_gia')
        .select(`
          mabaogia,
          trangthai,
          noidung,
          tongcong,
          thoigiandapung,
          ke_toan(hoten),
          phieu_bao_kham(
            mabaokham,
            lenh_sua_chua(
              malenh,
              phieu_yeu_cau(
                mayeucau,
                modelmay,
                motaloi,
                vitricongtruong,
                khach_hang(tencongty, sodienthoai)
              )
            )
          )
        `)
        .eq('trangthai', 'Khách yêu cầu điều chỉnh')
        .order('thoigiandapung', { ascending: false });

      if (error) throw error;

      return res.json({ success: true, danhSach: data || [] });
    } catch (err) {
      console.error('Lỗi layYeuCauDieuChinh:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/ke-toan/phieu-bao-gia — Tạo hoặc cập nhật báo giá
  taoBaoGia: async (req, res) => {
    try {
      const { mabaokham, mayeucau, mabaogia, tendonvi, diachidonvi, sodienthoaidonvi, chiphinhancong, chiphiphutung, chiphikhac, tongcong, noidung } = req.body;
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

      // Kiểm tra báo giá cũ có phải đang chờ điều chỉnh không
      let trangthaiMoi = 'Chờ phê duyệt';
      let guiLaiKhach = false;
      
      if (mabaogia) {
        const { data: bgCu } = await supabase
          .from('phieu_bao_gia')
          .select('trangthai')
          .eq('mabaogia', mabaogia)
          .maybeSingle();
        
        if (bgCu?.trangthai === 'Khách yêu cầu điều chỉnh') {
          trangthaiMoi = 'Đã gửi khách';  // Gửi lại khách hàng
          guiLaiKhach = true;
        }
      }

      const baoGiaData = {
        mabaokham:         mabaokham ?? null,
        maketoan:          keToan?.maketoan ?? null,
        tendonvi:          tendonvi || '',
        diachidonvi:       diachidonvi || '',
        sodienthoaidonvi:  sodienthoaidonvi || '',
        chiphinhancong:    Number(chiphinhancong) || 0,
        chiphiphutung:     Number(chiphiphutung)  || 0,
        chiphikhac:        Number(chiphikhac)     || 0,
        tongcong:          Number(tongcong)        || 0,
        hieuluc:           '7 ngày',
        trangthai:         trangthaiMoi,
        thoigianlap:       new Date().toISOString(),
        thoigiandapung:    new Date().toISOString(),
        noidung:           noidung || null,
      };

      let data, error;

      if (mabaogia) {
        // Kiểm tra trạng thái cũ trước khi update
        let noidungMoi = noidung;
        
        if (guiLaiKhach) {
          // Lấy dữ liệu cũ từ DB để merge
          const { data: bgCu } = await supabase
            .from('phieu_bao_gia')
            .select('noidung')
            .eq('mabaogia', mabaogia)
            .maybeSingle();
          
          // Merge: giữ lại dữ liệu cũ (trừ laborList, partsList, processingList, otherList), 
          // cập nhật với dữ liệu mới từ frontend
          noidungMoi = {
            ...(bgCu?.noidung || {}),          // Giữ tất cả dữ liệu cũ
            ...(noidung || {}),                  // Ghi đè với dữ liệu mới
            // Đảm bảo giữ lại lý do điều chỉnh nếu có
            lydieuchinh: noidung?.lydieuchinh || bgCu?.noidung?.lydieuchinh || null,
          };
        }

        // UPDATE nếu đã có mabaogia
        const result = await supabase
          .from('phieu_bao_gia')
          .update({ ...baoGiaData, noidung: noidungMoi })
          .eq('mabaogia', mabaogia)
          .select();
        data = result.data;
        error = result.error;
      } else {
        // INSERT mới nếu chưa có
        const result = await supabase
          .from('phieu_bao_gia')
          .insert([baoGiaData])
          .select();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Cập nhật trạng thái phiếu yêu cầu
      const trangthaiPYC = guiLaiKhach ? 'Chờ phê duyệt lại' : 'Đã báo giá';
      await supabase
        .from('phieu_yeu_cau')
        .update({ trangthai: trangthaiPYC })
        .eq('mayeucau', mayeucau);

      emit('bao_gia_thay_doi');
      emit('yeu_cau_thay_doi');
      return res.status(201).json({
        success: true,
        baogia: data[0],
        guiLaiKhach: guiLaiKhach
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = keToanController;
