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
  }
};

module.exports = LenhSuaChuaModel;
