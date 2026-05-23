const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports.supabase = supabase;

module.exports.kiemTraKetNoiSupabase = async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    console.log("👉 Kết nối Supabase: THÀNH CÔNG! 🎉");
  } catch (error) {
    console.log("❌ Kết nối Supabase: THẤT BẠI!");
    console.error("Chi tiết lỗi Supabase:", error.message);
  }
};

