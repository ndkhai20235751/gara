const { supabase } = require('../config/superbase');

const LenhSuaChuaModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('lenh_sua_chua').select('*');
    if (error) throw error;
    return data;
  },
  create: async (lenhData) => {
    const { data, error } = await supabase.from('lenh_sua_chua').insert([lenhData]).select();
    if (error) throw error;
    return data[0];
  },
  getByMatho: async (matho) => {
    const { data, error } = await supabase
      .from('lenh_sua_chua')
      .select('*, phieu_yeu_cau(*, khach_hang(tencongty, sodienthoai))')
      .eq('matho', matho)
      .order('thoigianphancong', { ascending: false });
    if (error) throw error;
    return data;
  },
  updateTrangThai: async (malenh, trangthai) => {
    const { data, error } = await supabase
      .from('lenh_sua_chua')
      .update({ trangthai })
      .eq('malenh', malenh)
      .select();
    if (error) throw error;
    return data[0];
  },
  getByMalenh: async (malenh) => {
    const { data, error } = await supabase
      .from('lenh_sua_chua')
      .select('*')
      .eq('malenh', malenh)
      .single();
    if (error) throw error;
    return data;
  },
};

module.exports = LenhSuaChuaModel;
