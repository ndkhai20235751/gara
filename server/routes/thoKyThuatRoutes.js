const express = require('express');
const router = express.Router();
const thoKyThuatController = require('../controllers/thoKyThuatController');
const { xacThucToken } = require('../middleware/authMiddleware');

router.get('/debug',                    xacThucToken, thoKyThuatController.debugTho);
router.get('/lenh',                     xacThucToken, thoKyThuatController.layLenhCuaTho);
router.patch('/lenh/:malenh/nhan',      xacThucToken, thoKyThuatController.nhanLenh);
router.patch('/lenh/:malenh/den',       xacThucToken, thoKyThuatController.denHienTruong);
router.patch('/lenh/:malenh/bat-dau',   xacThucToken, thoKyThuatController.batDauSuaChua);
router.patch('/lenh/:malenh/hoan-thanh', xacThucToken, thoKyThuatController.hoanThanhSuaChua);
router.post('/phieu-bao-kham',          xacThucToken, thoKyThuatController.nopPhieuGiamDinh);

module.exports = router;
