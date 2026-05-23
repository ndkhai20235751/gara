const { supabase } = require('../config/superbase');

const KeToanModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('ke_toan').select('*');
    if (error) throw error;
    return data;
  },
  createHoaDon: async (hoaDonData) => {
    const { data, error } = await supabase.from('ke_toan').insert([hoaDonData]).select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = KeToanModel;
