const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'nguyennhatnguyen2892021@gmail.com',
    pass: process.env.EMAIL_PASS || '',
  },
});

const guiBaoGiaKhachHang = async (khachHang, baoGia, chiTietBaoGia) => {
  const { tencongty, email, sodienthoai } = khachHang;
  const { mabaogia, tongcong, chiphinhancong, chiphiphutung, chiphikhac } = baoGia;

  const formatVnd = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 20px;">
        <h1 style="color: #0066cc; margin: 0;">MÁY CÔNG TRÌNH KHÁNH NGUYÊN</h1>
        <p style="margin: 5px 0;">📞 Hotline: 086 289 2021</p>
        <p style="margin: 0;">📍 Số 629, Tổ 36, Phường Cự Khối, Quận Long Biên, Hà Nội</p>
      </div>

      <div style="padding: 20px 0;">
        <h2 style="color: #333; text-align: center;">BẢNG BÁO GIÁ DỊCH VỤ</h2>
        <p style="text-align: center; color: #666;">Mã báo giá: <strong>#${mabaogia}</strong></p>
      </div>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p><strong>Kính gửi:</strong> ${tencongty || 'Quý khách hàng'}</p>
        <p><strong>Email:</strong> ${email || '—'}</p>
        <p><strong>Điện thoại:</strong> ${sodienthoai || '—'}</p>
      </div>

      <p>Xin chào <strong>${tencongty || 'Quý khách hàng'}</strong>,</p>
      <p>Cảm ơn Quý công ty đã quan tâm đến dịch vụ của chúng tôi. Sau đây, chúng tôi xin gửi bảng báo giá dịch vụ sửa chữa theo yêu cầu:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #0066cc; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Hạng mục</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Số tiền (VND)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">I. Chi phí nhân công</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${formatVnd(chiphinhancong)}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #ddd;">II. Chi phí phụ tùng</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${formatVnd(chiphiphutung)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">III. Chi phí khác</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${formatVnd(chiphikhac)}</td>
          </tr>
          <tr style="background-color: #e6f3ff; font-weight: bold;">
            <td style="padding: 12px; border: 1px solid #ddd; font-size: 1.1em;">TỔNG CỘNG</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #0066cc; font-size: 1.1em;">${formatVnd(tongcong)}</td>
          </tr>
        </tbody>
      </table>

      <p style="font-style: italic;"><strong>Bằng chữ:</strong> ${soSangChu(tongcong)}</p>

      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #856404;">ĐIỀU KIỆN THƯƠNG MẠI</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Tiêu chuẩn kỹ thuật:</strong> Đáp ứng đúng tiêu chuẩn kỹ thuật của nhà sản xuất.</li>
          <li><strong>Thanh toán:</strong> Thanh toán 100% bằng VNĐ qua phương thức chuyển khoản.</li>
          <li><strong>Tài khoản:</strong> Nguyễn Văn Khánh - Techcombank - 1268300490</li>
          <li><strong>Thời hạn hiệu lực:</strong> 7 ngày kể từ ngày báo giá.</li>
        </ul>
      </div>

      <p>Nếu có bất kỳ thắc mắc nào, Quý khách vui lòng liên hệ hotline <strong>086 289 2021</strong> để được tư vấn.</p>
      <p>Trân trọng cảm ơn!</p>

      <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 20px; text-align: center; color: #666;">
        <p style="margin: 0;"><strong>MÁY CÔNG TRÌNH KHÁNH NGUYÊN</strong></p>
        <p style="margin: 5px 0;">Hotline: 086 289 2021 (Zalo)</p>
        <p style="margin: 0;">Email: nguyennhatnguyen2892021@gmail.com</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Máy Công Trình Khánh Nguyên" <${process.env.EMAIL_USER || 'nguyennhatnguyen2892021@gmail.com'}>`,
    to: email,
    subject: `[BÁO GIÁ #${mabaogia}] Máy Công Trình Khánh Nguyên - Bảng báo giá dịch vụ sửa chữa`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email báo giá #${mabaogia} đã gửi đến ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Lỗi gửi email báo giá #${mabaogia} đến ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// Hàm chuyển số thành chữ (VNĐ)
function soSangChu(num) {
  if (!num || num === 0) return 'Không đồng chẵn';

  const donVi = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const hang = ['', 'nghìn', 'triệu', 'tỷ'];

  const docSo = (n) => {
    if (n === 0) return 'không';
    if (n < 10) return donVi[n];
    if (n < 100) {
      const chuc = Math.floor(n / 10);
      const dv = n % 10;
      const ck = chuc === 1 ? 'mười' : (donVi[chuc] + ' mươi');
      return dv === 0 ? ck : (ck + ' ' + donVi[dv]);
    }
    return 'không';
  };

  const parts = [];
  let tier = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk > 0) {
      parts.unshift(docSo(chunk) + (tier > 0 ? ' ' + hang[tier] : ''));
    }
    num = Math.floor(num / 1000);
    tier++;
  }

  const result = parts.join(' ').trim();
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn';
}

module.exports = {
  guiBaoGiaKhachHang,
};
