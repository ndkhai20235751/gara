const { supabase } = require('../config/superbase');

const ChuXuongModel = {
  create: async (data_cx) => {
    const { data, error } = await supabase.from('chu_xuong').insert([data_cx]).select();
    if (error) throw error;
    return data[0];
  },
  getThongTin: async () => {
    const { data, error } = await supabase.from('chu_xuong').select('*');
    if (error) throw error;
    return data;
  },
  updateThongTin: async (id, updateData) => {
    const { data, error } = await supabase.from('chu_xuong').update(updateData).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  getByMaNguoiDung: async (manguoidung) => {
    const { data, error } = await supabase
      .from('chu_xuong')
      .select('*')
      .eq('manguoidung', manguoidung)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};

module.exports = ChuXuongModel;
