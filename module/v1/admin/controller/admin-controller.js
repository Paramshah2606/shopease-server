const AdminModel = require('../model/admin-model.js');
const Common=require("../../../../config/common.js");
const rules=require("../validation-rules.js")
const {t}=require('localizify');
const middleware = require('../../../../middleware/middleware.js');
const ResponseCode = require('../../../../config/response-code.js');

const AdminController = {
    login(req,res){
        const data = {
            password:req.body.password,
            device_type:req.body.device_type,
            email_phone:req.body.email_phone
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.login, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.login(req,res);
    },
    logout(req,res){
        AdminModel.logout(req,res);
    },
    add_product(req,res){
        const data = {
            name:req.body.name,
            description:req.body.description,
            materials:req.body.materials,
            care:req.body.care,
            suitable_for:req.body.suitable_for,
            brand_id:req.body.brand_id,
            sub_category_id:req.body.sub_category_id,
            category_id:req.body.category_id,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_product, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.add_product(req,res);
    },
    edit_product(req,res){
        const data = {
            name:req.body.name,
            description:req.body.description,
            materials:req.body.materials,
            care:req.body.care,
            suitable_for:req.body.suitable_for,
            brand_id:req.body.brand_id,
            sub_category_id:req.body.sub_category_id,
            category_id:req.body.category_id,
            product_id:req.body.product_id,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.edit_product, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.edit_product(req,res);
    },
    delete_product(req,res){
        console.log("req body",req.body);
        const data = {
            product_id: req.body.product_id
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.delete_product, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.delete_product(req,res);
    },
    add_combination(req,res){
        const data = {
            product_id: req.body.product_id, 
            combinations: req.body.combinations
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_combination, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.add_combination(req,res);
    },
    delete_combination(req,res){
        const data = {
            combination_id:req.body.combination_id,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.delete_combination, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.delete_combination(req,res);
    },
    edit_combination(req,res){
        const data = {
            combination_id:req.body.combination_id,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.edit_combination, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.edit_combination(req,res);
    },
    add_category(req,res){
        AdminModel.add_category(req,res);
    },
    delete_category(req,res){
        const data = {
            category_id:req.body.category_id,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.delete_category, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }
        AdminModel.delete_category(req,res);
    },
    add_sub_category(req,res){
        const data = {
            name:req.body.name,
            category_id:req.body.category_id,
            size_group_id:req.body.size_group_id
        };

        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_sub_category, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }
        AdminModel.add_sub_category(req,res);
    },
    delete_sub_category(req,res){
        const data = {
            sub_category_id:req.body.sub_category_id,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.delete_sub_category, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }
        AdminModel.delete_sub_category(req,res);
    },
    fetch_size_group(req,res){
        AdminModel.fetch_size_group(req,res);
    },
    add_size_group(req,res){
        const data = {
            size_group:req.body.size_group,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_size_group, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.add_size_group(req,res);
    },
    fetch_size_list(req,res){
        const data = {
            size_group_id:req.body.size_group_id,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.fetch_size_list, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.fetch_size_list(req,res);
    },
    add_size_list(req,res){
        const data = {
            size:req.body.size,
            size_group_id:req.body.size_group_id,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_size_list, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.add_size_list(req,res);
    },
    add_color(req,res){
        const data = {
            color:req.body.color,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_color, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.add_color(req,res);
    },
    add_brand(req,res){
        const data = {
            name:req.body.name,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_brand, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.add_brand(req,res);
    },
    fetch_brand(req,res){
        const data = {
            name:req.body.name,
        };
        
        const message={
            required:t('required')
        }

        // const result = Common.checkValidations(data, rules.add_brand, message);

        // if (!result.success) {
        //     return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
        //         keyword: result.error
        //     });
        // }

        AdminModel.fetch_brand(req,res);
    },
    add_collection(req,res){
        const data = {
            name:req.body.name,
            description:req.body.description
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_collection, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }

        AdminModel.add_collection(req,res);
    },
    delete_collection(req,res){
        const data = {
            collection_id:req.body.collection_id,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.delete_collection, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }
        AdminModel.delete_collection(req,res);
    },
    add_product_in_collection(req,res){
        const data = {
            collection_id:req.body.collection_id,
            product_id:req.body.product_id,
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.add_product_in_collection, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }
        AdminModel.add_product_in_collection(req,res);
    },
    delete_product_in_collection(req,res){
        const data = {
            collection_id:req.body.collection_id,
            product_id:req.body.product_id
        };
        
        const message={
            required:t('required')
        }

        const result = Common.checkValidations(data, rules.delete_product_in_collection, message);

        if (!result.success) {
            return middleware.sendResponse(req, res, 200, ResponseCode.VALIDATION_ERROR, {
                keyword: result.error
            });
        }
        AdminModel.delete_product_in_collection(req,res);
    },
     update_order_status(req,res){
        AdminModel.update_order_status(req,res);
    },
    add_promocode(req,res){
        AdminModel.add_promocode(req,res);
    },
    delete_promocode(req,res){
        AdminModel.delete_promocode(req,res);
    }
}

module.exports=AdminController;