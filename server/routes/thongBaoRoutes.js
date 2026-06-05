const express = require('express');
const router = express.Router();
const thongBaoController = require('../controllers/thongBaoController');
const { xacThucToken } = require('../middleware/authMiddleware');

router.get('/',              xacThucToken, thongBaoController.layThongBao);
router.put('/:mathongbao/doc', xacThucToken, thongBaoController.danhDauDaDoc);
router.get('/chi-tiet/:mabaogia', xacThucToken, thongBaoController.layChiTietBaoGia);

module.exports = router;
