const HomeModel = require('../model/home-model.js');
const Common=require("../../../../../config/common.js");
const rules=require("../../validation-rules.js")
const {t}=require('localizify');
const middleware = require('../../../../../middleware/middleware.js');
const ResponseCode = require('../../../../../config/response-code.js');

const HomeController = {
    upload_photo(req,res){
        console.log(req.files);
        const files=req.files;
        HomeModel.upload_photo(req,res,files);
    },
    fetch_products(req,res){
        HomeModel.fetch_products(req,res);
    },
    product_detail(req,res){
        const data = {
            product_id:req.body.product_id
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.product_detail, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }
        HomeModel.product_detail(req,res);
    },
    fetch_collections(req,res){
        HomeModel.fetch_collections(req,res);
    },
    fetch_category(req,res){
        HomeModel.fetch_category(req,res);
    },
    fetch_sub_category(req,res){
        const data = {
            category_id:req.body.category_id
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.fetch_sub_category, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }
        HomeModel.fetch_sub_category(req,res);
    },
    fetch_tags(req,res){
        HomeModel.fetch_tags(req,res);
    },
     fetch_brands(req,res){
        HomeModel.fetch_brands(req,res);
    },
    fetch_cart(req,res){
        HomeModel.fetch_cart(req,res);
    },
    manage_cart(req,res){
        const data = {
            product_combination_id:req.body.product_combination_id,
            action:req.body.action
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.manage_cart, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }
        HomeModel.manage_cart(req,res);
    },
    product_in_cart(req,res){
        HomeModel.product_in_cart(req,res);
    },
    place_order(req,res){
        const data = {
            shipping_method:req.body.shipping_method,
            payment_method:req.body.payment_method,
            shipping_address_id:req.body.shipping_address_id,
            card_id:req.body.card_id
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.place_order, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }
        HomeModel.place_order(req,res);
    },
    fetch_order_summary(req,res){
        HomeModel.fetch_order_summary(req,res);
    },
    fetch_user_order(req,res){
        HomeModel.fetch_user_order(req,res);
    },
    add_address(req,res){
        const data = {
            first_name:req.body.first_name,
            last_name:req.body.last_name,
            address:req.body.address,
            city:req.body.city,
            state:req.body.state,
            zip:req.body.zip,
            phone:req.body.phone
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_address, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }
        HomeModel.add_address(req,res);
    },
    fetch_address(req,res){
        HomeModel.fetch_address(req,res);
    },
    delete_address(req,res){
        HomeModel.delete_address(req,res);
    },
    edit_address(req,res){
        HomeModel.edit_address(req,res);
    },
    add_card(req,res){
        const data = {
            name: req.body.name,
            card_number: req.body.card_number,
            expiry_month: req.body.expiry_month,
            expiry_year: req.body.expiry_year,
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_card, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }
        HomeModel.add_card(req,res);
    },
    fetch_card(req,res){
        HomeModel.fetch_card(req,res);
    },
    apply_promocode(req,res){
        HomeModel.apply_promocode(req,res);
    },
    fetch_promocode(req,res){
        HomeModel.fetch_promocode(req,res);
    },
    manage_wishlist(req,res){
        const data = {
            product_combination_id:req.body.product_combination_id,
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.manage_wishlist, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }
        HomeModel.manage_wishlist(req,res);
    },
    fetch_wishlist(req,res){
        HomeModel.fetch_wishlist(req,res);
    },
    fetch_blogs(req,res){
        HomeModel.fetch_blogs(req,res);
    },
    blog_detail(req,res){
        const data = {
            blog_id:req.body.blog_id
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.blog_detail, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: result.error
            });
        }
        HomeModel.blog_detail(req,res);
    }
}

module.exports=HomeController;