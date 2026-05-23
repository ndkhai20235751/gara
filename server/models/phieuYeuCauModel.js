const { supabase } = require('../config/superbase');

const PhieuYeuCauModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('phieu_yeu_cau').select('*');
    if (error) throw error;
    return data;
  },
  // Bạn có thể viết thêm câu lệnh JOIN với bảng khách hàng nếu trong DB có khóa ngoại (Foreign Key)
  getAllWithKhachHang: async () => {
    const { data, error } = await supabase
      .from('phieu_yeu_cau')
      .select('*, khach_hang(*)'); // Supabase tự động JOIN nếu có FK
    if (error) throw error;
    return data;
  },
  create: async (phieuData) => {
    const { data, error } = await supabase.from('phieu_yeu_cau').insert([phieuData]).select();
    if (error) throw error;
    return data[0];
  },

  getByKhachHang: async (makh) => {
    const { data, error } = await supabase
      .from('phieu_yeu_cau')
      .select('*')
      .eq('makh', makh)
      .order('ngaytao', { ascending: false });
    if (error) throw error;
    return data;
  },
};

module.exports = PhieuYeuCauModel;
