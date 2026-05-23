const { supabase } = require('../config/superbase');

const ChuXuongModel = {
  getThongTin: async () => {
    const { data, error } = await supabase.from('chu_xuong').select('*');
    if (error) throw error;
    return data;
  },
  updateThongTin: async (id, updateData) => {
    const { data, error } = await supabase.from('chu_xuong').update(updateData).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = ChuXuongModel;
