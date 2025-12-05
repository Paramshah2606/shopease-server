const express = require('express');
const router = express.Router();
const AdminController = require("../controller/admin-controller");
const UserHomeController=require("../../user/home/controller/home-controller");

// Authentication
router.post('/login', AdminController.login);
// Logout route
router.get('/logout', AdminController.logout);


// Product Management
router.post('/add_product',AdminController.add_product);

router.post('/product_detail',UserHomeController.product_detail);

router.post('/edit_product',AdminController.edit_product);

router.post('/delete_product',AdminController.delete_product);


// Product Listing
router.post('/fetch_products',UserHomeController.fetch_products);


// Product Combination Management
router.post('/add_combination',AdminController.add_combination);

router.delete('/delete_combination',AdminController.delete_combination);

router.patch('/edit_combination',AdminController.edit_combination);


// Category Management
router.post('/add_category',AdminController.add_category);

router.get('/fetch_category',UserHomeController.fetch_category);

router.delete('/delete_category',AdminController.delete_category);


// Sub Category Management
router.post('/fetch_sub_category',UserHomeController.fetch_sub_category);

router.post('/add_sub_category',AdminController.add_sub_category);

router.delete('/delete_sub_category',AdminController.delete_sub_category);


// Size group management
router.get('/fetch_size_group',AdminController.fetch_size_group);

router.post('/add_size_group',AdminController.add_size_group);


// Size list management
router.get('/fetch_size_list',AdminController.fetch_size_list);

router.post('/add_size_list',AdminController.add_size_list);


// Color Management
router.post('/add_color',AdminController.add_color);


// Brand Management
router.post('/add_brand',AdminController.add_brand);

router.get('/fetch_brand',AdminController.fetch_brand);


// Collection Management
router.post('/add_collection',AdminController.add_collection);

router.delete('/delete_collection',AdminController.delete_collection);

router.post('/collection/add_product',AdminController.add_product_in_collection);

router.delete('/collection/delete_product',AdminController.delete_product_in_collection);


// Order Management
router.post('/update_order_status',AdminController.update_order_status);


// Coupon Management 
router.post('/add_promocode',AdminController.add_promocode);

router.delete('/delete_promocode',AdminController.delete_promocode);

module.exports = router;