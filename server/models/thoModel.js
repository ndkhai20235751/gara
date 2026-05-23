const { supabase } = require('../config/superbase');

const ThoKyThuatModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('tho_ky_thuat').select('*');
    if (error) throw error;
    return data;
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('tho_ky_thuat').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  create: async (dataTho) => {
    const { data, error } = await supabase.from('tho_ky_thuat').insert([dataTho]).select();
    if (error) throw error;
    return data[0];
  },
  update: async (id, updateData) => {
    const { data, error } = await supabase.from('tho_ky_thuat').update(updateData).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = ThoKyThuatModel;
