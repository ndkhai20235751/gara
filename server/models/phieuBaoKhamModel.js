const { supabase } = require('../config/superbase');

const PhieuBaoKhamModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('phieu_bao_kham').select('*');
    if (error) throw error;
    return data;
  },
  create: async (phieuData) => {
    const { data, error } = await supabase.from('phieu_bao_kham').insert([phieuData]).select();
    if (error) throw error;
    return data[0];
  },
  getAllWithJoin: async () => {
    // Lấy phiếu giám định kèm thông tin báo giá (bao gồm noidung)
    const { data, error } = await supabase
      .from('phieu_bao_kham')
      .select(`
        *,
        phieu_bao_gia(mabaogia, tendonvi, diachidonvi, sodienthoaidonvi, noidung, chiphinhancong, chiphiphutung, chiphikhac, tongcong, trangthai, thoigiandapung),
        lenh_sua_chua(malenh, tho_ky_thuat(hoten, sodienthoai), phieu_yeu_cau(*, khach_hang(tencongty, sodienthoai)))
      `)
      .order('thoigianlap', { ascending: false });
    if (error) throw error;

    // Transform data: nếu phieu_bao_gia là array thì lấy phần tử đầu tiên
    return data.map(p => {
      let bg = p.phieu_bao_gia;
      if (Array.isArray(bg) && bg.length > 0) {
        bg = bg[0];
      }
      return { ...p, phieu_bao_gia: bg || null };
    });
  },
};

module.exports = PhieuBaoKhamModel;
