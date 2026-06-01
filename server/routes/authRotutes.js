const express = require('express');
const router = express.Router();
const authController=require('../controllers/authController');


router.post('/login',authController.dangNhap);
router.post('/register',authController.dangKy);
module.exports=router;
