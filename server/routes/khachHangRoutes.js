const express = require('express');
const router = express.Router();
const khachHangController = require('../controllers/khachHangController');
const { xacThucToken } = require('../middleware/authMiddleware');

router.get('/bao-gia',                           xacThucToken, khachHangController.layBaoGia);
router.get('/bao-gia/:mabaogia',                xacThucToken, khachHangController.layChiTietBaoGia);
router.post('/bao-gia/:mabaogia/duyet',         xacThucToken, khachHangController.pheDuyetBaoGia);
router.post('/bao-gia/:mabaogia/dieu-chinh',    xacThucToken, khachHangController.yeuCauDieuChinh);

module.exports = router;
