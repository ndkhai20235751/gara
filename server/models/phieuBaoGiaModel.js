const { supabase } = require('../config/superbase');

const PhieuBaoGiaModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('phieu_bao_gia').select('*');
    if (error) throw error;
    return data;
  },
  create: async (phieuData) => {
    const { data, error } = await supabase.from('phieu_bao_gia').insert([phieuData]).select();
    if (error) throw error;
    return data[0];
  },
  getAllWithJoin: async () => {
    const { data, error } = await supabase
      .from('phieu_bao_gia')
      .select(`
        *,
        ke_toan(hoten),
        phieu_bao_kham(
          mabaokham,
          lenh_sua_chua(
            malenh,
            phieu_yeu_cau(mayeucau, modelmay, motaloi, vitricongtruong, trangthai,
              khach_hang(tencongty, sodienthoai))
          )
        )
      `)
      .order('thoigiandapung', { ascending: false });
    if (error) throw error;
    return data;
  },
  // Lấy chi tiết báo giá kèm noidung đầy đủ cho chủ xưởng
  getById: async (mabaogia) => {
    const { data, error } = await supabase
      .from('phieu_bao_gia')
      .select(`
        *,
        ke_toan(hoten),
        phieu_bao_kham(
          mabaokham,
          lenh_sua_chua(
            malenh,
            phieu_yeu_cau(mayeucau, modelmay, motaloi, vitricongtruong, trangthai,
              khach_hang(tencongty, sodienthoai))
          )
        )
      `)
      .eq('mabaogia', mabaogia)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  updateStatus: async (mabaogia, trangthai) => {
    const { data, error } = await supabase
      .from('phieu_bao_gia')
      .update({ trangthai })
      .eq('mabaogia', mabaogia)
      .select();
    if (error) throw error;
    return data[0];
  },
  updateChiPhi: async (mabaogia, chiPhi) => {
    const { data, error } = await supabase
      .from('phieu_bao_gia')
      .update(chiPhi)
      .eq('mabaogia', mabaogia)
      .select();
    if (error) throw error;
    return data[0];
  },
};

module.exports = PhieuBaoGiaModel;
