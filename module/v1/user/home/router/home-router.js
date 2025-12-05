const express = require('express');
const router = express.Router();
const HomeController = require("../controller/home-controller");

// Product Fetching

router.post("/fetch_products",HomeController.fetch_products);

router.post("/product_detail",HomeController.product_detail);

// Collection Fetching

router.post("/fetch_collections",HomeController.fetch_collections);


// Category Fetching

router.get('/fetch_category',HomeController.fetch_category);


// Sub Category Fetching

router.post('/fetch_sub_category',HomeController.fetch_sub_category);


// Tag Fetching

router.get('/fetch_tags',HomeController.fetch_tags);

router.post('/fetch_brands',HomeController.fetch_brands);


// Cart Managing (Increase,Decrease,Clear,Remove)

router.get("/fetch_cart",HomeController.fetch_cart);

router.post("/manage_cart",HomeController.manage_cart);

router.post("/product_in_cart",HomeController.product_in_cart);


// Order Placing

router.post("/place_order",HomeController.place_order);

router.post("/fetch_order_summary",HomeController.fetch_order_summary);

router.post("/fetch_user_order",HomeController.fetch_user_order);


// Address Management

router.post("/add_address",HomeController.add_address);

router.post("/fetch_address",HomeController.fetch_address);

router.delete("/delete_address",HomeController.delete_address);

router.put("/edit_address",HomeController.edit_address);


// Card Management

router.post("/add_card",HomeController.add_card);

router.get("/fetch_card",HomeController.fetch_card);

// Promocode Management

router.post("/apply_promocode",HomeController.apply_promocode);

router.get("/fetch_promocode",HomeController.fetch_promocode);


// Wishilist Management

router.post("/manage_wishlist",HomeController.manage_wishlist);

router.get("/fetch_wishlist",HomeController.fetch_wishlist);


// Blogs Management

router.post("/fetch_blogs",HomeController.fetch_blogs);

router.post("/blog_detail",HomeController.blog_detail);



module.exports = router;