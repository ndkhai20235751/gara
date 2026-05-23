const { supabase } = require('../config/superbase');

const NghiemThuModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('nghiem_thu').select('*');
    if (error) throw error;
    return data;
  },
  create: async (nghiemThuData) => {
    const { data, error } = await supabase.from('nghiem_thu').insert([nghiemThuData]).select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = NghiemThuModel;
