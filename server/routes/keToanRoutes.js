const express = require('express');
const router = express.Router();
const keToanController = require('../controllers/keToanController');
const { xacThucToken } = require('../middleware/authMiddleware');

router.get('/phieu-bao-kham',   xacThucToken, keToanController.layPhieuChoBaoGia);
router.post('/phieu-bao-gia',   xacThucToken, keToanController.taoBaoGia);

module.exports = router;
