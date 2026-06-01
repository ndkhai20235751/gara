const { supabase } = require('../config/superbase'); // Đường dẫn tới file chứa client của bạn

const NguoiDungModel = {
  // Lấy tất cả người dùng
  getAll: async () => {
    const { data, error } = await supabase.from('nguoi_dung').select('*');
    if (error) throw error;
    return data;
  },

  // Lấy theo ID
  getById: async (id) => {
    const { data, error } = await supabase.from('nguoi_dung').select('*').eq('manguoidung', id).single();
    if (error) throw error;
    return data;
  },

  // Tạo mới người dùng
  create: async (userData) => {
    const { data, error } = await supabase.from('nguoi_dung').insert([userData]).select();
    if (error) {
      // Sequence bị lệch → tự reset rồi thử lại
      if (error.code === '23505' && error.message.includes('pk_nguoi_dung')) {
        await supabase.rpc('reset_nguoi_dung_sequence');
        const { data: data2, error: error2 } = await supabase.from('nguoi_dung').insert([userData]).select();
        if (error2) throw error2;
        return data2[0];
      }
      throw error;
    }
    return data[0];
  },
  
  getByEmail: async(email)=>{
     const{data,error}=await supabase
       .from('nguoi_dung')
       .select('*')
       .eq('email',email)
       .maybeSingle();
     if(error) {
       console.error('getByEmail lỗi:', error.code, error.message);
       return null;
     }
     return data;
  },
  // Cập nhật thông tin
  update: async (id, updateData) => {
    const { data, error } = await supabase.from('nguoi_dung').update(updateData).eq('manguoidung', id).select();
    if (error) throw error;
    return data[0];
  },

  // Xóa người dùng
  delete: async (id) => {
    const { error } = await supabase.from('nguoi_dung').delete().eq('manguoidung', id);
    if (error) throw error;
    return true;
  }
};

module.exports = NguoiDungModel;
