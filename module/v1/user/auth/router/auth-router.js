const express = require('express');
const router = express.Router();
const AuthController = require("../controller/auth-controller");
let {userUpload}=require('../../../../../utils/multer');
let middleware=require("../../../../../middleware/middleware");

// Sign-up 
router.post('/signup',AuthController.signup);

router.post('/signup_updateImage',AuthController.signup_updateImage);

router.post('/signup_verification', AuthController.signup_verification);


// Resend code
router.post('/resend_code', AuthController.resend_code);


// Login-Logout
router.post('/login', AuthController.login);

router.get('/logout', AuthController.logout);


// Forgot password Management
router.post('/forgot_password', AuthController.forgot_password);

router.post('/password_verification', AuthController.password_verification);

router.post('/password_change', AuthController.password_change);


// Reset password 
router.post('/reset_password', AuthController.reset_password);


// Account Deletion
router.delete("/delete_account",AuthController.delete_account);


// Edit profile
router.patch("/edit_profile",AuthController.edit_profile);

router.post('/upload_image',
    middleware.multerErrorHandler(userUpload.fields([{name:"image",maxCount:1}])),
    AuthController.upload_images);

router.post('/upload_multiple_image',
    middleware.multerErrorHandler(userUpload.fields([{name:"images",maxCount:7}])),
    AuthController.upload_multiple_images);

router.get("/fetch_user_detail",AuthController.fetch_user_detail);

router.post("/update_phone_email",AuthController.update_phone_email);



router.get("/google",AuthController.google);

router.get("/google/callback",AuthController.google_callback);


module.exports = router;