require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/superbase');

async function hashTatCaMatKhau() {
  // Lấy toàn bộ người dùng
  const { data: users, error } = await supabase.from('nguoi_dung').select('*');
  if (error) {
    console.error('❌ Không lấy được danh sách người dùng:', error.message);
    process.exit(1);
  }

  console.log(`Tìm thấy ${users.length} tài khoản:\n`);

  for (const user of users) {
    const laBcrypt = user.matkhau && user.matkhau.startsWith('$2');
    console.log(`  Email : ${user.email}`);
    console.log(`  Vai trò: ${user.vaitro}`);
    console.log(`  Mật khẩu hiện tại: ${laBcrypt ? '✅ Đã hash' : '⚠️  Plaintext: ' + user.matkhau}`);

    if (!laBcrypt) {
      const hash = await bcrypt.hash(user.matkhau, 10);
      const { error: updateErr } = await supabase
        .from('nguoi_dung')
        .update({ matkhau: hash })
        .eq('manguoidung', user.manguoidung);

      if (updateErr) {
        console.log(`  → ❌ Cập nhật thất bại: ${updateErr.message}`);
      } else {
        console.log(`  → ✅ Đã hash và cập nhật thành công`);
      }
    }
    console.log('');
  }

  console.log('Hoàn tất!');
  process.exit(0);
}

hashTatCaMatKhau();
