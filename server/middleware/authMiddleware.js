const jwt = require('jsonwebtoken');

const xacThucToken = (req, res, next) => {
  // Lấy token từ header "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có token xác thực, vui lòng đăng nhập',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, nguoiDung) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
    }
    req.nguoiDung = nguoiDung;
    next();
  });
};

module.exports = { xacThucToken };