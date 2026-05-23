const { supabase } = require('../config/superbase');

const KhachHangModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('khach_hang').select('*');
    if (error) throw error;
    return data;
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('khach_hang').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  create: async (customerData) => {
    const { data, error } = await supabase.from('khach_hang').insert([customerData]).select();
    if (error) throw error;
    return data[0];
  },
  update: async (id, updateData) => {
    const { data, error } = await supabase.from('khach_hang').update(updateData).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  delete: async (id) => {
    const { error } = await supabase.from('khach_hang').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

module.exports = KhachHangModel;
