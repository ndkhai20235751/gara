const { supabase } = require('../config/superbase');

const KhachHangModel = {

  // Lấy khách hàng theo mã người dùng
  getByMaNguoiDung: async (manguoidung) => {
    const { data, error } = await supabase
      .from('khach_hang')
      .select('*')
      .eq('manguoidung', manguoidung)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Lấy báo giá của khách hàng (cả đã gửi và đã duyệt)
  getBaoGiaChoKhach: async (makhachhang) => {
    const { data, error } = await supabase
      .from('phieu_bao_gia')
      .select(`
        mabaogia,
        trangthai,
        tongcong,
        thoigiandapung,
        noidung,
        phieu_bao_kham(
          mabaokham,
          lenh_sua_chua(
            malenh,
            phieu_yeu_cau(
              mayeucau,
              modelmay,
              motaloi,
              vitricongtruong,
              makhachhang
            )
          )
        )
      `)
      .in('trangthai', ['Đã gửi khách', 'Khách đã duyệt', 'Khách yêu cầu điều chỉnh'])
      .order('thoigiandapung', { ascending: false });
    if (error) throw error;

    // Lọc chỉ lấy báo giá của khách hàng đã đăng nhập
    return data.filter(bg => {
      const pyc = bg.phieu_bao_kham?.lenh_sua_chua?.phieu_yeu_cau;
      return pyc?.makhachhang === makhachhang;
    });
  },

  // Lấy chi tiết báo giá
  getChiTietBaoGia: async (mabaogia, makhachhang) => {
    const { data, error } = await supabase
      .from('phieu_bao_gia')
      .select(`
        *,
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
              makhachhang,
              khach_hang(tencongty, sodienthoai)
            )
          )
        )
      `)
      .eq('mabaogia', mabaogia)
      .maybeSingle();
    if (error) throw error;

    // Kiểm tra báo giá thuộc về khách hàng
    if (data) {
      const pyc = data.phieu_bao_kham?.lenh_sua_chua?.phieu_yeu_cau;
      if (pyc?.makhachhang !== makhachhang) {
        return null; // Không thuộc về khách hàng này
      }
    }

    return data;
  },

  // Phê duyệt báo giá
  pheDuyetBaoGia: async (mabaogia) => {
    const { data, error } = await supabase
      .from('phieu_bao_gia')
      .update({ trangthai: 'Khách đã duyệt' })
      .eq('mabaogia', mabaogia)
      .select();
    if (error) throw error;

    // Cập nhật trạng thái phiếu yêu cầu
    if (data && data[0]?.mabaokham) {
      const { data: pbk } = await supabase
        .from('phieu_bao_kham')
        .select('malenh')
        .eq('mabaokham', data[0].mabaokham)
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
            .update({ trangthai: 'Đã duyệt báo giá' })
            .eq('mayeucau', lenh.mayeucau);
        }
      }
    }

    return data[0];
  },

  // Yêu cầu điều chỉnh báo giá
  yeuCauDieuChinh: async (mabaogia, lydo) => {
    // Lấy thông tin báo giá hiện tại (bao gồm cả noidung gốc)
    const { data: bgData, error: bgError } = await supabase
      .from('phieu_bao_gia')
      .select('mabaokham, noidung')
      .eq('mabaogia', mabaogia)
      .maybeSingle();
    if (bgError) throw bgError;

    // Giữ lại dữ liệu báo giá gốc, chỉ thêm lý do điều chỉnh
    const noidungMoi = {
      ...(bgData?.noidung || {}),  // Giữ nguyên dữ liệu cũ
      lydieuchinh: lydo            // Thêm lý do điều chỉnh
    };

    // Cập nhật trạng thái và lưu lý do vào báo giá
    const { data, error } = await supabase
      .from('phieu_bao_gia')
      .update({ 
        trangthai: 'Khách yêu cầu điều chỉnh',
        noidung: noidungMoi
      })
      .eq('mabaogia', mabaogia)
      .select();
    if (error) throw error;

    // Cập nhật trạng thái phiếu yêu cầu
    if (data && data[0]?.mabaokham) {
      try {
        const { data: pbk } = await supabase
          .from('phieu_bao_kham')
          .select('malenh')
          .eq('mabaokham', data[0].mabaokham)
          .maybeSingle();

        if (pbk?.malenh) {
          const { data: lenh } = await supabase
            .from('lenh_sua_chua')
            .select('mayeucau')
            .eq('malenh', pbk.malenh)
            .maybeSingle();

          if (lenh?.mayeucau) {
            // Chỉ cập nhật trạng thái, không ghi đè motaloi
            await supabase
              .from('phieu_yeu_cau')
              .update({ trangthai: 'Chờ điều chỉnh báo giá' })
              .eq('mayeucau', lenh.mayeucau);
          }
        }
      } catch (err) {
        console.log('Lỗi cập nhật phiếu yêu cầu:', err.message);
      }
    }

    return data[0];
  },
};

module.exports = KhachHangModel;
