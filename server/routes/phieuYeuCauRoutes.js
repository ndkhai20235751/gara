const express = require('express');
const router = express.Router();
const phieuYeuCauController = require('../controllers/phieuYeuCauController');
const { xacThucToken } = require('../middleware/authMiddleware');
router.post('/', xacThucToken, phieuYeuCauController.taoPhieu);
router.get('/', xacThucToken, phieuYeuCauController.layDanhSach);
module.exports = router;