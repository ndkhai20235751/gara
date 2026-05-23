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
  updateStatus: async (id, trangThai) => {
    const { data, error } = await supabase.from('phieu_bao_gia').update({ trang_thai: trangThai }).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = PhieuBaoGiaModel;
