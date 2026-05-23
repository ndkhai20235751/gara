const { supabase } = require('../config/superbase');

const PhieuBaoKhamModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('phieu_bao_kham').select('*');
    if (error) throw error;
    return data;
  },
  create: async (phieuData) => {
    const { data, error } = await supabase.from('phieu_bao_kham').insert([phieuData]).select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = PhieuBaoKhamModel;
