const { supabase } = require('../config/superbase');

const KeToanModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('ke_toan').select('*');
    if (error) throw error;
    return data;
  },
  create: async (data_kt) => {
    const { data, error } = await supabase.from('ke_toan').insert([data_kt]).select();
    if (error) throw error;
    return data[0];
  },
  createHoaDon: async (hoaDonData) => {
    const { data, error } = await supabase.from('ke_toan').insert([hoaDonData]).select();
    if (error) throw error;
    return data[0];
  },
  getByMaNguoiDung: async (manguoidung) => {
    const { data, error } = await supabase
      .from('ke_toan')
      .select('*')
      .eq('manguoidung', manguoidung)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};

module.exports = KeToanModel;
