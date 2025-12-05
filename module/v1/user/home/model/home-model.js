const Common=require("../../../../../config/common.js")
const constant=require("../../../../../config/constant.js");
const ResponseCode=require("../../../../../config/response-code.js");
const middleware=require("../../../../../middleware/middleware.js");

const HomeModel = {
    async upload_photo(req,res,files){
       try {
         let user_id=req.user_id;
        const fetchSignupStepQuery = "SELECT signup_step FROM tbl_user WHERE id = ? AND is_active=1 AND is_deleted=0";
        let fetchSignupStepRes=await Common.executeQuery(fetchSignupStepQuery,user_id);
        let signup_step = fetchSignupStepRes[0].signup_step;
        if(signup_step==2){
            let file_profile='';
            if(files.profile_photo){    
                file_profile = `http://localhost:8080/uploads/users/${files.profile_photo[0].filename}`;
            }
         let uploadPhotoQuery = `UPDATE tbl_user SET profile_photo=?,signup_step='3' WHERE id=?`;
         let uploadPhotoParams = [file_profile,user_id];
         await Common.executeQuery (uploadPhotoQuery, uploadPhotoParams);    
         return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, { keyword: "profile_photo_uploaded" }, file_profile.profile_photo);
        }else{
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "access_denied" });
        }
       } catch (error) {
        console.error("Photo Upload error: ", error);
        return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
       }
    },

    async fetch_products(req,res){
        try {
            console.log(req.body);
            const {
                category_id,
                sub_category_id,
                tag_id,
                tag_ids,
                brand_id,
                search_term,
                suitable_for,
            }=req.body;

            const page = parseInt(req.body.page) || 1;
            const limit = parseInt(req.body.limit) || 10;

            const offset = (page - 1) * limit;

            let productQuery;
            let productQueryParams=[limit,offset];
    
                let category_conditon='';
                let sub_category_condition='';
                let search_condition_1='';
                let search_condition_2='';
                let sutiable_condition='';
                let tag_condition='';
                let tag_condition_2='';
                let brand_condition='';
                if(category_id){
                    category_conditon=`AND p.category_id=${category_id}`;
                }
                if(sub_category_id){
                    sub_category_condition=`AND p.sub_category_id=${sub_category_id}`;
                }
                if(search_term){
                    search_condition_2=`AND c.is_active=1 AND c.is_deleted=0 AND c.is_main_category=1 AND ( p.name LIKE '%${search_term}%' OR c.name LIKE '%${search_term}%')`;
                    search_condition_1=`LEFT JOIN tbl_category as c ON p.category_id=c.id`;
                }
                if(suitable_for){
                    sutiable_condition=`AND p.suitable_for=${suitable_for}`;
                }
                if(tag_id){
                    tag_condition=`AND p.id IN (SELECT product_id FROM tbl_product_tag WHERE tag_id=${tag_id})`
                }
                if(tag_ids && tag_ids.length!=0){
                    tag_condition_2=`AND p.id IN (SELECT product_id FROM tbl_product_tag WHERE tag_id IN (${tag_ids}))`
                }
                if(brand_id){
                    brand_condition=`AND p.brand_id=${brand_id}`;
                }
                productQuery=`SELECT p.id,p.name,p.description,p.cover_image,(SELECT SUM(stock) FROM tbl_product_combination WHERE product_id=p.id)  as total_stock,(SELECT min(price) FROM tbl_product_combination WHERE product_id=p.id) as price FROM tbl_product as p ${search_condition_1} WHERE p.is_active=1 AND p.is_deleted=0 ${sub_category_condition} ${search_condition_2} ${category_conditon} ${sutiable_condition} ${tag_condition} ${tag_condition_2} ${brand_condition} ORDER BY p.created_at DESC,total_stock DESC LIMIT ? OFFSET ?`
                console.log(productQuery);
                let fetchProductRes=await Common.executeQuery(productQuery,productQueryParams);
                let [productCountRes]=await Common.executeQuery('SELECT count(id) as total FROM tbl_product WHERE is_active=1 AND is_deleted=0');
                let total=productCountRes.total;
                let totalPages=Math.ceil(total/limit);
                return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "products_fetched_successfully" },{page,limit,total,totalPages,products:fetchProductRes});
        } catch (error) {
            console.log("Error in fetching productsss"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },

    async product_detail(req,res){
        try {
            let user_id=req.user_id;
            let {product_id,color_id,size_id}=req.body;
            let productDetailsQuery=`SELECT 
    p.id AS product_id,
    p.category_id,
    p.sub_category_id,
    p.brand_id,
    p.suitable_for,
    p.name,
    p.description,
    p.materials,
    p.care,
    p.cover_image,
    (
        SELECT JSON_ARRAYAGG(image)
        FROM tbl_product_gallery
        WHERE product_id = p.id AND is_active = 1 AND is_deleted = 0
    ) AS gallery_images,
    (
        SELECT JSON_ARRAYAGG(JSON_OBJECT('id', c.id, 'color', c.color))
        FROM tbl_color c
        WHERE c.id IN (
            SELECT color_id FROM tbl_product_combination 
            WHERE product_id = p.id AND is_active = 1 AND is_deleted = 0
        ) AND c.is_active = 1 AND c.is_deleted = 0
    ) AS colors,
    (
        SELECT JSON_ARRAYAGG(JSON_OBJECT('id', s.id, 'size', s.size))
        FROM tbl_size_list s
        WHERE s.id IN (
            SELECT size_list_id FROM tbl_product_combination 
            WHERE product_id = p.id AND is_active = 1 AND is_deleted = 0
        ) AND s.is_active = 1 AND s.is_deleted = 0
    ) AS sizes,
    (
        SELECT JSON_OBJECT(
            'product_combination_id', pc.id,
            'price', pc.price,
            'stock',pc.stock,
            'color', c.color,
            'color_id', c.id,
            'size', s.size,
            'size_id', s.id
        )
        FROM tbl_product_combination pc
        JOIN tbl_color c ON pc.color_id = c.id
        JOIN tbl_size_list s ON pc.size_list_id = s.id
        WHERE 
            pc.product_id = p.id 
            AND pc.is_active = 1 AND pc.is_deleted = 0
            AND (? IS NULL OR pc.color_id = ?)   
            AND (? IS NULL OR pc.size_list_id = ?) 
        ORDER BY pc.price ASC
        LIMIT 1
    ) AS selected_info,
    (
        SELECT JSON_ARRAYAGG(image)
        FROM tbl_product_image
        WHERE product_combination_id = (
            SELECT id
            FROM tbl_product_combination pc
            WHERE 
                pc.product_id = p.id 
                AND pc.is_active = 1 AND pc.is_deleted = 0
                AND (? IS NULL OR pc.color_id = ?)
                AND (? IS NULL OR pc.size_list_id = ?)
            ORDER BY pc.price ASC
            LIMIT 1
        ) AND is_active = 1 AND is_deleted = 0
    ) AS combination_images,
        (
  SELECT IFNULL(SUM(c.quantity), 0)
  FROM tbl_cart AS c
  JOIN tbl_product_combination AS pc ON pc.id = c.product_combination_id
  WHERE pc.product_id = p.id AND c.user_id = ?
) AS in_cart,
     (
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'product_combination_id', pc.id,
            'color_id', pc.color_id,
            'size_list_id', pc.size_list_id,
            'stock', pc.stock
        )
    )
    FROM tbl_product_combination pc
    WHERE 
        pc.product_id = p.id AND pc.is_active = 1 AND pc.is_deleted = 0
) AS all_variants_stock
FROM tbl_product p
WHERE p.id = ? AND p.is_active = 1 AND p.is_deleted = 0;
`;
            let productDetailsParams=[
  color_id, color_id,
  size_id, size_id,
  color_id, color_id,
  size_id, size_id,
  user_id,
  product_id,
];
            let productDetailsRes=await Common.executeQuery(productDetailsQuery,productDetailsParams);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "product_details_fetched_successfully" },productDetailsRes[0]);
        } catch (error) {
            console.log("Error in fetching product details"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },

    async fetch_collections(req,res){
        try {
            let {collection_id}=req.body;
            if(collection_id){
                let collectionQuery=`SELECT id,name,cover_image,description FROM tbl_collection WHERE is_active=1 AND is_deleted=0 AND id=?;`
                let collectionParams=[collection_id];
                let collectionResult=await Common.executeQuery(collectionQuery,collectionParams);
                let collectionProductQuery=`SELECT p.id,p.name,p.cover_image,p.description,MIN(pco.price) as price FROM tbl_product as p JOIN tbl_product_collection as pc ON pc.product_id=p.id JOIN tbl_product_combination as pco ON p.id=pco.product_id WHERE pc.collection_id=? AND p.is_active=1 AND p.is_deleted=0 AND pc.is_active=1 AND pc.is_deleted=0 AND pco.is_active=1 AND pco.is_deleted=0 GROUP BY p.id;`
                let collectionProductParams=[collection_id];
                let collectionProductResult=await Common.executeQuery(collectionProductQuery,collectionProductParams);
                return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "collections_fetched_successfully" },{collection:collectionResult[0],products:collectionProductResult});
            }else{
                let collectionQuery=`SELECT id,cover_image,name,description FROM tbl_collection WHERE is_active=1 AND is_deleted=0`;
                let collectionResult=await Common.executeQuery(collectionQuery);
                return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "collections_fetched_successfully" },{collections:collectionResult});
            }
        } catch (error) {
            console.log("Error in fetching collections"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async fetch_category(req,res){
            try {
                let categoryRes=await Common.executeQuery("SELECT id,name FROM tbl_category WHERE is_main_category=1 AND is_active=1 AND is_deleted=0");
                return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "category_fetched_succesfully" },categoryRes);
            } catch (error) {
                console.log("Error in adding category"+error);
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
            }
        },
        async fetch_sub_category(req,res){
            try {
                let {category_id}=req.body
                let subCategoryRes=await Common.executeQuery("SELECT id,name FROM tbl_category WHERE is_main_category=0 AND parent_category_id=? AND is_active=1 AND is_deleted=0",[category_id]);
                return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "category_fetched_succesfully" },subCategoryRes);
            } catch (error) {
                console.log("Error in fetching sub category"+error);
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
            }
        },
        async fetch_tags(req,res){
            try {
                let tagRes=await Common.executeQuery("SELECT t.id,t.tag FROM tbl_product_tag as pt LEFT JOIN tbl_tag as t ON t.id=pt.tag_id WHERE pt.is_active=1 AND pt.is_deleted=0 AND t.is_active=1 AND t.is_deleted=0 GROUP BY pt.tag_id");
                return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "tags_fetched_succesfully" },tagRes);
            } catch (error) {
                console.log("Error in fetching tags"+error);
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
            }
        },
        async fetch_brands(req,res){
            try {
                let {category_id,sub_category_id}=req.body;
                let category_condition='';
                let sub_category_condition='';
                if(category_id!=''){
                    category_condition=`AND category_id=${category_id}`
                }
                if(sub_category_id!=''){
                    sub_category_condition=`AND sub_category_id=${sub_category_id}`
                }
                let query=`SELECT b.id,CONCAT(b.name," (",ifnull((SELECT count(id) FROM tbl_product WHERE brand_id=b.id ${category_condition} ${sub_category_condition} AND is_active=1 AND is_deleted=0 GROUP BY b.id),0),")") as name FROM tbl_brand as b WHERE is_active=1 AND is_deleted=0`;
                let brandRes=await Common.executeQuery(query);
                return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "brands_fetched_succesfully" },brandRes);
            } catch (error) {
                console.log("Error in fetching brands"+error);
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
            }
        },
        async fetch_cart(req,res){
            try {
                let user_id=req.user_id;
                let fetchCart=await Common.executeQuery("SELECT c.product_combination_id,c.quantity,p.name,pc.price,p.cover_image,(SELECT ifnull(SUM(c.quantity * pc.price),0) as sub_total FROM tbl_cart as c JOIN tbl_product_combination as pc ON c.product_combination_id = pc.id WHERE c.user_id = ? AND c.is_active = 1 AND c.is_deleted = 0) as sub_total,(SELECT size FROM tbl_size_list WHERE id=pc.size_list_id AND is_active=1 AND is_deleted=0) as size,(SELECT color FROM tbl_color WHERE is_active=1 AND is_deleted=0 AND id=pc.color_id) as color FROM tbl_cart as c LEFT JOIN tbl_product_combination as pc ON pc.id=c.product_combination_id LEFT JOIN tbl_product as p ON p.id=pc.product_id WHERE c.user_id=? AND c.is_active=1 AND c.is_deleted=0 AND pc.is_active=1 AND pc.is_deleted=0 AND p.is_active=1 AND p.is_deleted=0",[user_id,user_id]);
                return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "cart_fetched_succesfully" },fetchCart);
            } catch (error) {
                console.log("Error in fetching cart"+error);
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
            }
        },
    async manage_cart(req,res){
        try {
            let user_id=req.user_id;
            let {product_combination_id,action}=req.body;
            if(action=='clear'){
                await Common.clearCart(user_id);
                return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "cart_cleared_successfully" });
            }

            let checkProductQuery='SELECT id,stock FROM tbl_product_combination WHERE id=? AND is_active=1 AND is_deleted=0';
            let checkProductParams=[product_combination_id];
            let checkProductRes=await Common.executeQuery(checkProductQuery,checkProductParams);
            if(checkProductRes.length==0){
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "product_not_found" });
            }
            console.log(checkProductRes);
            let stock=checkProductRes[0].stock;

            let checkExistingQuery='SELECT id,quantity FROM tbl_cart WHERE user_id=? AND product_combination_id=? AND is_active=1 AND is_deleted=0';
            let checkExistingParams=[user_id,product_combination_id];
            let checkExistingRes=await Common.executeQuery(checkExistingQuery,checkExistingParams);

            if(checkExistingRes.length>0){
                let cart_id=checkExistingRes[0].id;
                let existingQuantity=checkExistingRes[0].quantity;
                let newQuantity;
                if((action=='dec' && existingQuantity=='1') || action=='del'){
                    await Common.executeQuery("DELETE FROM tbl_cart WHERE id=? AND product_combination_id=?",[cart_id,product_combination_id]);
                }else if(action=="dec"){
                    newQuantity=existingQuantity-1;
                }else{
                    newQuantity=existingQuantity+1;
                    if(newQuantity>stock){
                        return middleware.sendResponse(req,res,200, ResponseCode.ERROR, { keyword: "product_not_in_stock" });
                    }
                }
                let updateCartQuery='UPDATE tbl_cart SET quantity=? WHERE product_combination_id=? AND id=? AND is_active=1 AND is_deleted=0';
                let updateCartParams=[newQuantity,product_combination_id,cart_id];
                await Common.executeQuery(updateCartQuery,updateCartParams);
            }else if(action=='inc'){
                if(stock==0){
                    return middleware.sendResponse(req,res,200, ResponseCode.ERROR, { keyword: "product_not_in_stock" });
                }
                let updateCartQuery='INSERT INTO tbl_cart (product_combination_id,quantity,user_id) VALUES (?,?,?)';
                let updateCartParams=[product_combination_id,1,user_id];
                await Common.executeQuery(updateCartQuery,updateCartParams);
            }else if(action=='dec' || action=="del"){
                return middleware.sendResponse(req,res,200, ResponseCode.ERROR, { keyword: "product_not_found" });
            }
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "cart_updated_successfully" });
        } catch (error) {
            console.log("Error in adding product to cart"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async product_in_cart(req,res){
        try{
            let {product_combination_id}=req.body;
            let user_id=req.user_id;
            let existingProduct=await Common.executeQuery("SELECT id FROM tbl_cart WHERE product_combination_id=? AND user_id=?",[product_combination_id,user_id]);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "product_in_cart_fetched" },{in_cart:existingProduct.length>0});
        }catch(error){
            console.log("Error in fetching product in cart"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async place_order(req,res){
        try {
            let user_id=req.user_id;
            let {shipping_method,payment_method,card_id,shipping_address_id,promo}=req.body;

            await Common.executeQuery("START TRANSACTION");
 
            let findPriceQuery="SELECT SUM(c.quantity * pc.price) as sub_total,count(*) as item_count FROM tbl_cart as c JOIN tbl_product_combination as pc ON c.product_combination_id = pc.id WHERE c.user_id = ? AND c.is_active = 1 AND c.is_deleted = 0";
            let PriceRes=await Common.executeQuery(findPriceQuery,[user_id]);
            let subTotal=PriceRes[0].sub_total || 0;
            let itemCount = PriceRes[0].item_count;
            if (itemCount === 0 || subTotal === 0) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "no_product_in_cart" });
            }

            let stockCheckRes=await Common.executeQuery("SELECT c.product_combination_id,c.quantity,pc.stock FROM tbl_cart as c LEFT JOIN tbl_product_combination as pc ON c.product_combination_id=pc.id WHERE c.is_active=1 AND c.is_deleted=0 AND pc.is_active=1 AND pc.is_deleted=0");
            console.log(
                stockCheckRes
            );
            for(let i=0;i<stockCheckRes.length;i++){
                if(Number(stockCheckRes[i].quantity)>Number(stockCheckRes[i].stock)){
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "product_out_of_stock" },{product_id:stockCheckRes[i].product_id});
                }
            }

            if(payment_method=="Card" && (card_id!=undefined && card_id!='') ){
                let checkCard=await Common.executeQuery("SELECT id FROM tbl_card WHERE id=? AND user_id=? AND is_active=1 AND is_deleted=0",[card_id,user_id]);
                if(checkCard.length==0){
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "card_not_found" });
                }
            }
            if(shipping_method=="Delivery" && (shipping_address_id!=undefined && shipping_address_id!='')){
                let checkAddress=await Common.executeQuery("SELECT id FROM tbl_shipping_address WHERE id=? AND user_id=? AND is_active=1 ANd is_deleted=0",[shipping_address_id,user_id]);
                if(checkAddress.length==0){
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "address_not_found" });
                }
            }
            let discount=0;
            if(promo){
                let promoRes=await Common.executeQuery("SELECT id,code,discount,min_order_value,max_discount,usage_limit,valid_until FROM tbl_promocode WHERE code=? AND is_active=1 AND is_deleted=0",[promo]);
                if(promoRes.length==0){
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "promocode_not_found" });
                }
                let valid_until=promoRes[0].valid_until;
                let promo_id=promoRes[0].id;
                let usage_limit=promoRes[0].usage_limit;
                let allowed_discount=promoRes[0].discount;
                let min_order_value=promoRes[0].min_order_value;
                let max_discount=promoRes[0].max_discount;
                const today = new Date();                    
                const expiryDate = new Date(valid_until);     

                const todayOnly = new Date(today.toISOString().split('T')[0]);

                if (expiryDate < todayOnly) {
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "promocode_expired" });
                } 
                let userUsageRes=await Common.executeQuery("SELECT count(*) as codeusage FROM tbl_reedemed_code WHERE user_id=? AND code_id=? AND is_active=1 AND is_deleted=0",[user_id,promo_id]);
                let user_usage=userUsageRes[0].codeusage;
                if(Number(user_usage)>=Number(usage_limit)){
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "promocode_already_used" });
                }
                if(Number(subTotal)<Number(min_order_value)){
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "order_value_not_matching" });
                }
                await Common.executeQuery("INSERT INTO tbl_reedemed_code (user_id,code_id) VALUES (?,?)",[user_id,promo_id]);
                discount=Math.min(parseFloat(subTotal)*parseFloat(allowed_discount)/100,parseFloat(max_discount));
            }
            let addOrderQuery='INSERT INTO tbl_order (user_id,shipping_method,payment_method,sub_total,discount,total,shipping_address_id,card_id) VALUES (?,?,?,?,?,?,?,?)';
            let addOrderParams=[user_id,shipping_method,payment_method,subTotal,discount,parseFloat(subTotal)-parseFloat(discount),shipping_address_id,card_id];
            let addOrderRes=await Common.executeQuery(addOrderQuery,addOrderParams);
            let order_id=addOrderRes.insertId;
            let orderDetailsQuery='SELECT c.product_combination_id,c.quantity,p.name,p.description,p.cover_image,pc.price,pc.size_list_id,pc.color_id,(SELECT size FROM tbl_size_list WHERE id=pc.size_list_id) as size_label,(SELECT color FROM tbl_color WHERE id=pc.color_id) as color_name FROM tbl_cart as c JOIN tbl_product_combination as pc ON c.product_combination_id=pc.id JOIN tbl_product as p ON p.id=pc.product_id WHERE c.is_active=1 AND c.is_deleted=0 AND c.user_id=?'
            let orderDetails=await Common.executeQuery(orderDetailsQuery,user_id);
            if (orderDetails.length > 0) {
                const insertBase = `INSERT INTO tbl_order_detail (order_id, product_combination_id, name, description, cover_image, quantity, price, size_list_id, color_id, size_label, color_name) VALUES `;
                const placeholders = [];
                const values = [];

                for (let item of orderDetails) {
                    placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                    values.push(
                    order_id,
                    item.product_combination_id,
                    item.name,
                    item.description || null,
                    item.cover_image || null,
                    item.quantity,
                    item.price,
                    item.size_list_id || null,
                    item.color_id || null,
                    item.size_label || null,
                    item.color_name || null
                );
            }

            const bulkInsertQuery = insertBase + placeholders.join(', ');
            await Common.executeQuery(bulkInsertQuery, values);
        
            let productsInOrder=await Common.executeQuery("SELECT od.product_combination_id, od.quantity,pc.stock FROM tbl_order_detail as od LEFT JOIN tbl_product_combination as pc ON od.product_combination_id=pc.id WHERE pc.is_active=1 AND pc.is_deleted=0 AND od.is_active=1 AND od.is_deleted=0 AND od.order_id=?",[order_id]);
            if(productsInOrder.length>0){
                for(let i=0;i<productsInOrder.length;i++){
                    let qty=Number(productsInOrder[i].quantity);
                    let stock=Number(productsInOrder[i].stock);
                    console.log(qty);
                    console.log(stock);
                    if(stock-qty>=0){
                        await Common.executeQuery("UPDATE tbl_product_combination SET stock=? WHERE id=?",[stock-qty,productsInOrder[i].product_combination_id]);
                    }else{
                        return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "product_out_of_stock" },{product_id:productsInOrder[i].product_combination_id});
                    }
                }
            }
            // throw new Error("PAram");
        }else{
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "product_details_not_found" });
        }
        await Common.clearCart(user_id);

        await Common.executeQuery("COMMIT");
        return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "order_placed_successfully" },{order_id:order_id});
        } catch (error) {
            console.log("Error in placing order"+error);
            try {
                await Common.executeQuery("ROLLBACK");
            } catch (rollbackError) {
                console.error("Error rolling back transaction:", rollbackError);
            }
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async fetch_order_summary(req,res){
        try{
            let user_id=req.user_id;
            let {order_id}=req.body;
            let query=`SELECT 
o.id,
  o.shipping_method,
  o.payment_method,
  o.shipping_address_id,
  o.sub_total,
  o.discount,
  o.total,
  o.card_id,
  o.payment_id,
  o.status,
  (
    SELECT 
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', id,
          'name', name,
          'cover_image', cover_image,
          'quantity', quantity,
          'price', price,
          'size_label', size_label,
          'color_name', color_name
        )
      )
    FROM tbl_order_detail 
    WHERE is_active = 1 AND is_deleted = 0 AND order_id = o.id
  ) AS order_items,
  (
    SELECT 
        JSON_OBJECT(
          'name', name,
          'card_number', card_number
		)
    FROM tbl_card 
    WHERE is_active = 1 AND is_deleted = 0 AND id = o.card_id
  ) AS card_detail,
  (
    SELECT 
        JSON_OBJECT(
          'first_name',first_name,
          'last_name',last_name,
          'address',address,
          'city',city,
          'state',state,
          'zip',zip,
          'phone',phone
      )
    FROM tbl_shipping_address
    WHERE is_active = 1 AND is_deleted = 0 AND id = o.shipping_address_id
  ) AS shipping_detail
FROM tbl_order as o 
WHERE o.user_id=? AND o.id = ? AND o.is_active = 1 AND o.is_deleted = 0;`
            let orderSummary=await Common.executeQuery(query,[user_id,order_id]);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "order_summary_fetched_successfully" },orderSummary);
        }catch(error){
            console.log("Error in fetching address"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async fetch_user_order(req,res){
        try{
            let user_id=req.user_id;
            let {tag}=req.body;
            let query=`SELECT id,shipping_method,payment_method,total,status FROM tbl_order WHERE user_id=? AND is_active=1 AND is_deleted=0`;
            if(tag=='C'){
                query+=`AND status='Cancelled'`;
            }else if(tag=='D'){
                query+=`AND status='Delivered`;
            }
            let order=await Common.executeQuery(query,[user_id]);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "address_fetched_successfully" },order);
        }catch(error){
            console.log("Error in fetching user order"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async add_address(req,res){
        try{
            let {first_name,last_name,address,city,state,zip,phone}=req.body;
            let user_id=req.user_id;
            console.log(user_id);
            let addAddressParams=[user_id,first_name,last_name,address,city,state,zip,phone];
            await Common.executeQuery("INSERT INTO tbl_shipping_address (user_id,first_name,last_name,address,city,state,zip,phone) VALUES (?,?,?,?,?,?,?,?)",addAddressParams);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "address_added_successfully" });
        }catch(error){
            console.log("Error in adding address"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async fetch_address(req,res){
        try{
            let user_id=req.user_id;
            let {address_id}=req.body;
            let query=`SELECT id,first_name,last_name,address,city,state,zip,phone FROM tbl_shipping_address WHERE user_id=? AND is_active=1 AND is_deleted=0`;
            if(address_id){
                query+=` AND id=${address_id}`;
            }
            let address=await Common.executeQuery(query,[user_id]);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "address_fetched_successfully" },{address});
        }catch(error){
            console.log("Error in fetching address"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async delete_address(req,res){
        try{
            let user_id=req.user_id;
            let {address_id}=req.body;
            await Common.executeQuery("UPDATE tbl_shipping_address SET is_active=0 WHERE user_id=? AND id=? AND is_active=1 AND is_deleted=0",[user_id,address_id]);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "address_deleted_successfully" });
        }catch(error){
            console.log("Error in fetching address"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async edit_address(req,res){
        try{
            let user_id=req.user_id;
            let {address_id,first_name,last_name,address,city,state,zip,phone}=req.body;
            let updatedata={};
            if(first_name!==undefined){
                updatedata.first_name=first_name;
            }
            if(last_name!==undefined){
                updatedata.last_name=last_name;
            }
            if(address!==undefined){
                updatedata.address=address;
            }
            if(city!==undefined){
                updatedata.city=city;
            }
            if(state!==undefined){
                updatedata.state=state;
            }
            if(zip!==undefined){
                updatedata.zip=zip;
            }
            if(phone!==undefined){
                updatedata.phone=phone;
            }
            if (Object.keys(updatedata).length === 0) {
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "nothing_to_update" });
            }
            console.log(updatedata);
            await Common.executeQuery("UPDATE tbl_shipping_address SET ? WHERE user_id=? AND id=? AND is_active=1 AND is_deleted=0",[updatedata,user_id,address_id]);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "address_updated_successfully" });
        }catch(error){
            console.log("Error in updating address"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async add_card(req,res){
        try{
            let {name,card_number,expiry_month,expiry_year}=req.body;
            let user_id=req.user_id;
            let addCardParams=[user_id,name,card_number,expiry_month,expiry_year];
            await Common.executeQuery("INSERT INTO tbl_card (user_id,name,card_number,expiry_month,expiry_year) VALUES (?,?,?,?,?)",addCardParams);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "card_added_successfully" });
        }catch(error){
            console.log("Error in adding card"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async fetch_card(req,res){
        try{
            let user_id=req.user_id;
            let card=await Common.executeQuery("SELECT id,name,card_number,expiry_month,expiry_year FROM tbl_card WHERE user_id=? AND is_active=1 AND is_deleted=0",[user_id]);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "cards_fetched_successfully" },card);
        }catch(error){
            console.log("Error in fetching cards"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },

    async apply_promocode(req,res){
        try{
            let user_id=req.user_id;
            let {subTotal,promo}=req.body;
            let discount=0;
            if(promo){
                let promoRes=await Common.executeQuery("SELECT id,code,discount,min_order_value,max_discount,usage_limit,valid_until FROM tbl_promocode WHERE code=? AND is_active=1 AND is_deleted=0",[promo]);
                if(promoRes.length==0){
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "promocode_not_found" });
                }
                let valid_until=promoRes[0].valid_until;
                let promo_id=promoRes[0].id;
                let usage_limit=promoRes[0].usage_limit;
                let allowed_discount=promoRes[0].discount;
                let min_order_value=promoRes[0].min_order_value;
                let max_discount=promoRes[0].max_discount;
                const today = new Date();                    
                const expiryDate = new Date(valid_until);     

                const todayOnly = new Date(today.toISOString().split('T')[0]);

                if (expiryDate < todayOnly) {
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "promocode_expired" });
                } 
                let userUsageRes=await Common.executeQuery("SELECT count(*) as codeusage FROM tbl_reedemed_code WHERE user_id=? AND code_id=? AND is_active=1 AND is_deleted=0",[user_id,promo_id]);
                let user_usage=userUsageRes[0].codeusage;
                if(Number(user_usage)>=Number(usage_limit)){
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "promocode_already_used" });
                }
                if(Number(subTotal)<Number(min_order_value)){
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "order_value_not_matching" });
                }
                await Common.executeQuery("INSERT INTO tbl_reedemed_code (user_id,code_id) VALUES (?,?)",[user_id,promo_id]);
                discount=Math.min(parseFloat(subTotal)*parseFloat(allowed_discount)/100,parseFloat(max_discount));
            }
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "promo_applied_successfully" },discount);
        }catch(error){
            console.log("Error in applying promocode"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },

    async fetch_promocode(req,res){
        try{
            let user_id=req.user_id;
            let promo=await Common.executeQuery("SELECT p.id,p.code,p.discount,p.max_discount,p.min_order_value,p.usage_limit,COALESCE(COUNT(rc.id), 0) AS `usage` FROM tbl_promocode p LEFT JOIN tbl_reedemed_code rc ON rc.code_id = p.id AND rc.user_id = ? AND rc.is_active = 1 AND rc.is_deleted = 0 WHERE p.is_active = 1 AND p.is_deleted = 0 GROUP BY p.id",[user_id]);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "promocode_fetched_successfully" },promo);
        }catch(error){
            console.log("Error in fetching promocode"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async manage_wishlist(req,res){
        try{
            let user_id=req.user_id;
            let {product_combination_id,action}=req.body;
            let existing=await Common.executeQuery("SELECT id FROM tbl_wishlist WHERE user_id=? AND product_combination_id=? AND is_active=1 AND is_deleted=0",[user_id,product_combination_id]);
            if(action=='R'){
                return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "wishlist_fetched_successfully" },existing.length>0);
            }
            if(existing.length==0){
                console.log("inserteddd");
                await Common.executeQuery("INSERT INTO tbl_wishlist (user_id,product_combination_id) VALUES (?,?)",[user_id,product_combination_id]);
            }else{
                console.log("deletingg..");
                await Common.executeQuery("DELETE FROM tbl_wishlist WHERE user_id=? AND product_combination_id=?",[user_id,product_combination_id]);
            }
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "wishlist_updated_successfully" },existing.length==0);
        }catch(error){
            console.log("Error in managing wishlist"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async fetch_wishlist(req,res){
        try {
            let user_id=req.user_id;
            let wishlistQuery=`SELECT w.product_combination_id,pc.price,pc.stock,p.name,p.description,p.cover_image,(
  SELECT IFNULL(SUM(c.quantity), 0)
  FROM tbl_cart AS c
  JOIN tbl_product_combination AS pc ON pc.id = c.product_combination_id
  WHERE pc.id = w.product_combination_id AND c.user_id = ?
) AS in_cart,(SELECT size FROM tbl_size_list WHERE id=pc.size_list_id AND is_active=1 AND is_deleted=0) as size,(SELECT color FROM tbl_color WHERE is_active=1 AND is_deleted=0 AND id=pc.color_id) as color
 FROM tbl_wishlist as w LEFT JOIN tbl_product_combination as pc ON pc.id=w.product_combination_id LEFT JOIN tbl_product as p ON pc.product_id=p.id WHERE w.user_id=? AND w.is_active=1 AND w.is_deleted=0 AND pc.is_active=1 AND pc.is_deleted=0 AND p.is_active=1 AND p.is_deleted=0`;
            let wishlistRes=await Common.executeQuery(wishlistQuery,[user_id,user_id]);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "wishlist_fetched_successfully" },wishlistRes);
        } catch (error) {
            console.log("Error in fetching wishlist"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async fetch_blogs(req,res){
        try{
            let {blog_category_id}=req.body;
            const page = parseInt(req.body.page) || 1;
            const limit = parseInt(req.body.limit) || 10;

            const offset = (page - 1) * limit;
            let fetchBlogQuery="SELECT b.id,b.topic,LEFT(b.description, 30) AS short_description,b.cover_image,DATE_FORMAT(b.created_at, '%Y-%m-%d') AS created_date,JSON_ARRAYAGG(t.tag) AS tags FROM tbl_blog as b LEFT JOIN tbl_blog_tag as bt ON bt.blog_id = b.id AND bt.is_active = 1 AND bt.is_deleted = 0 LEFT JOIN tbl_tag as t ON t.id = bt.tag_id WHERE b.is_active = 1 AND b.is_deleted = 0 ";
            if(blog_category_id){
                fetchBlogQuery+=` AND b.blog_category_id=${blog_category_id}`
            }
            fetchBlogQuery+=' GROUP BY b.id LIMIT ? OFFSET ?';
            let fetchBlogs=await Common.executeQuery(fetchBlogQuery,[limit,offset]);
            const [totalRes]=await Common.executeQuery('SELECT count(id) as total FROM tbl_blog WHERE is_active=1 AND is_deleted=0');
            const total=totalRes.total;
            const totalPages=Math.ceil(total/limit);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "blog_fetched_successfully" },{page,limit,total,totalPages,blogs:fetchBlogs});
        }catch(error){
            console.log("Error in fetching blogs"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async blog_detail(req,res){
        try{
            let {blog_id}=req.body;
            let fetchBlogQuery="SELECT id,topic,description,cover_image,DATE_FORMAT(b.created_at, '%Y-%m-%d') AS created_date FROM tbl_blog as b WHERE b.is_active=1 AND b.is_deleted=0 AND b.id=?";
            let [fetchBlogDetail]=await Common.executeQuery(fetchBlogQuery,[blog_id]);
            return middleware.sendResponse(req,res,200, ResponseCode.SUCCESS, { keyword: "blog_details_fetched_successfully" },fetchBlogDetail);
        }catch(error){
            console.log("Error in fetching blog details"+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    }
};


module.exports=HomeModel;