const AuthModel = require('../model/auth-model.js');
const Common=require("../../../../../config/common.js");
const rules=require("../../validation-rules.js")
const {t}=require('localizify');
const middleware = require('../../../../../middleware/middleware.js');
const ResponseCode = require('../../../../../config/response-code.js');

const AuthController = {
    signup(req, res){
        const data = {
            login_type:req.body.login_type,
            full_name:req.body.full_name,
            country_code:req.body.country_code,
            phone: req.body.phone,
            email: req.body.email,
            password:req.body.password,
            social_id:req.body.social_id,
        };

        const message={
            required:t('required'),
            digits_between:t('digits_between'),
            email:t('email')
        }
        let result;
        if(!data.login_type){
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }else if(data.login_type=="N"){
            result = Common.checkValidations(data, rules.signup_normal, message);
        }else{
            result = Common.checkValidations(data, rules.signup_social, message);
        }
        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }

        AuthModel.signup(req,res);
    },
    signup_updateImage(req,res){
        AuthModel.signup_updateImage(req,res);
    },
    signup_verification(req, res){
        const data = {
            code: req.body.code,
            user_id:req.body.user_id
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.signup_verification, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }
        AuthModel.signup_verification(req,res);
    },
    resend_code(req,res){
        AuthModel.resend_code(req,res);
    },
    login(req,res){
        const data = {
            login_type:req.body.login_type,
            social_id:req.body.social_id,
            password:req.body.password,
            email_phone:req.body.email_phone
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.login, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }

        AuthModel.login(req,res);
    },
    logout(req,res){
        AuthModel.logout(req,res);
    },
    forgot_password(req,res){
        AuthModel.forgot_password(req,res);
    },
    password_verification(req,res){
        const data = {
            code: req.body.code
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.password_verification, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }
        AuthModel.password_verification(req,res);
    },
    password_change(req,res){
        const data = {
            password: req.body.password
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.password_change, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }

        AuthModel.password_change(req,res);
    },
    reset_password(req,res){
        AuthModel.reset_password(req,res);
    },
    delete_account(req,res){
        AuthModel.delete_account(req,res);
    },
    edit_profile(req,res){
        AuthModel.edit_profile(req,res);
    },
    upload_images(req,res){
        console.log(req.files);
        const files=req.files;
        AuthModel.upload_images(req,res,files);
    },
    upload_multiple_images(req,res){
        console.log(req.files);
        const files=req.files;
        AuthModel.upload_multiple_images(req,res,files);
    },
    fetch_user_detail(req,res){
        AuthModel.fetch_user_detail(req,res);
    },
    update_phone_email(req,res){
        AuthModel.update_phone_email(req,res);
    },

    google(req,res){
        AuthModel.google(req,res);
    },

    google_callback(req,res){
        AuthModel.google_callback(req,res);
    }
}

module.exports=AuthController;