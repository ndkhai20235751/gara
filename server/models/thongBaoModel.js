const { supabase } = require('../config/superbase');

const ThongBaoModel = {
  // Lấy danh sách thông báo cho kế toán
  getThongBao: async (limit = 20) => {
    const { data, error } = await supabase
      .from('thong_bao')
      .select('*')
      .eq('loai', 'yeu_cau_dieu_chinh')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  // Đánh dấu đã đọc
  danhDauDaDoc: async (mathongbao) => {
    const { data, error } = await supabase
      .from('thong_bao')
      .update({ noidung: 'Đã đọc' })
      .eq('mathongbao', mathongbao)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Đếm thông báo chưa đọc
  demChuaDoc: async () => {
    const { data, error } = await supabase
      .from('thong_bao')
      .select('*')
      .eq('loai', 'yeu_cau_dieu_chinh')
      .ilike('noidung', '%Đã đọc%');
    
    // Đếm ngược: đếm những cái CHƯA đọc
    const { count, error: countError } = await supabase
      .from('thong_bao')
      .select('*', { count: 'exact', head: true })
      .eq('loai', 'yeu_cau_dieu_chinh');
    if (countError) throw countError;
    
    // Lấy tất cả rồi đếm những chưa đọc (không chứa "Đã đọc")
    const all = await supabase
      .from('thong_bao')
      .select('noidung')
      .eq('loai', 'yeu_cau_dieu_chinh');
    
    const chuaDoc = (all.data || []).filter(t => !t.noidung?.includes('Đã đọc'));
    return chuaDoc.length;
  },

  // Lấy chi tiết báo giá cần điều chỉnh
  getChiTietBaoGiaDieuChinh: async (mabaogia) => {
    const { data, error } = await supabase
      .from('phieu_bao_gia')
      .select(`
        *,
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
      .eq('mabaogia', mabaogia)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};

module.exports = ThongBaoModel;
