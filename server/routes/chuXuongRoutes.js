const express = require('express');
const router = express.Router();
const chuXuongController = require('../controllers/chuXuongController');
const { xacThucToken } = require('../middleware/authMiddleware');

router.get('/yeu-cau',                          xacThucToken, chuXuongController.layTatCaYeuCau);
router.get('/danh-sach-tho',                    xacThucToken, chuXuongController.layDanhSachTho);
router.get('/lenh',                             xacThucToken, chuXuongController.layTatCaLenh);
router.get('/bao-gia',                          xacThucToken, chuXuongController.layBaoGia);
router.post('/duyet',                           xacThucToken, chuXuongController.duyetVaPhanCong);
router.patch('/tuchoi/:mayeucau',               xacThucToken, chuXuongController.tuChoi);
router.patch('/cap-nhat/:mayeucau',             xacThucToken, chuXuongController.capNhatTrangThai);
router.patch('/bao-gia/:mabaogia',              xacThucToken, chuXuongController.suaBaoGia);
router.patch('/bao-gia/:mabaogia/duyet',        xacThucToken, chuXuongController.duyetVaGuiKhach);

module.exports = router;
