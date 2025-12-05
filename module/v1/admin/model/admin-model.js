const Common=require("../../../../config/common.js")
const ResponseCode=require("../../../../config/response-code.js");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const middleware=require("../../../../middleware/middleware.js");

const AdminModel = {
    async login(req, res){
        try {
            const { email_phone, password } = req.body;          
            let loginAdminQuery=`SELECT id,password,role FROM tbl_user WHERE (phone = ? OR email=?) AND is_active=1 AND is_deleted=0 AND role='Admin'`;
            let loginAdminQueryParam=[email_phone,email_phone];
            let loginAdminResult=await Common.executeQuery(loginAdminQuery,loginAdminQueryParam);
            if(loginAdminResult.length==0){
                return middleware.sendResponse(req, res,200, ResponseCode.USER_NOT_REGISTERED, { keyword: "admin_not_registered" });
            }else{
                let admin_id=loginAdminResult[0].id;
                console.log(password);
                console.log(loginAdminResult[0].password);
                const isMatch = await bcrypt.compare( password,loginAdminResult[0].password);
                if (!isMatch) {
                    return middleware.sendResponse(req, res,200, ResponseCode.UNAUTHORIZED, { keyword: "login_incorrect_password" });
                }
                const role = loginAdminResult[0].role;
                const payload = { id: admin_id, email_phone, role };
                const admin_token = Common.generateJWTToken(payload);
                await Common.updateTokenInDb(admin_id,admin_token,role);
                return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "admin_login_success" },{user_token:admin_token});
            }
        } catch (error) {
            console.log(error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }  
    },    

    async logout(req,res){
        try {
            let admin_id=req.user_id;
            await Common.executeQuery(`UPDATE tbl_device SET user_token=NULL,device_token=NULL WHERE user_id=?`,admin_id);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "admin_logged_out" });
        } catch (error) {
            console.log("Error in logout: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },

    async add_product(req,res){
        try {
            let {name,description,materials,care,suitable_for,brand_id,sub_category_id,category_id}=req.body;
            checkBrand=await Common.executeQuery("SELECT id FROM tbl_brand WHERE id=? AND is_active=1 AND is_deleted=0",[brand_id]);
            if(checkBrand.length==0){
                return middleware.sendResponse(req, res,200, ResponseCode.NOT_FOUND, { keyword: "brand_not_found" });
            }
            checkCategory=await Common.executeQuery("SELECT id FROM tbl_category WHERE id=? AND is_active=1 AND is_deleted=0",[category_id]);
            if(checkCategory.length==0){
                return middleware.sendResponse(req, res,200, ResponseCode.NOT_FOUND, { keyword: "category_not_found" });
            }
            checkSubCategory=await Common.executeQuery("SELECT id FROM tbl_category WHERE id=? AND is_main_category=0 AND parent_category_id=? AND is_active=1 AND is_deleted=0",[sub_category_id,category_id]);
            if(checkSubCategory.length==0){
                return middleware.sendResponse(req, res,200, ResponseCode.NOT_FOUND, { keyword: "sub_category_not_found" });
            }
            checkExisting=await Common.executeQuery("SELECT id FROM tbl_product WHERE name=? AND description=? AND brand_id=? AND category_id=? AND sub_category_id=?",[name,description,brand_id,category_id,sub_category_id]);
            if(checkExisting.length>0){
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "product_already exists" });
            }
            let productInsertQuery='INSERT INTO tbl_product (name,description,materials,care,suitable_for,brand_id,sub_category_id,category_id) VALUES (?,?,?,?,?,?,?,?)';
            let productInsertParams=[name,description,materials,care,suitable_for,brand_id,sub_category_id,category_id];
            let productInsertRes=await Common.executeQuery(productInsertQuery,productInsertParams);
            let product_id=productInsertRes.insertId;
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "product_added_succesfully" },{product_id:product_id});
        } catch (error) {
            console.log("Error in adding product: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },

    async delete_product(req,res){
        try {
            let {product_id}=req.body;
            await Common.executeQuery("UPDATE tbl_product SET deleted=1 WHERE id=?",[product_id]);
            await Common.executeQuery("UPDATE tbl_product_combination SET is_deleted=1 WHERE product_id=?",[product_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "product_deleted_succesfully" });
        } catch (error) {
            console.log("Error in deleting product: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },

     async edit_product(req,res){
        try {
            let {name,description,materials,care,suitable_for,brand_id,sub_category_id,category_id,product_id}=req.body;
            let updateData={name,description,materials,care,suitable_for,brand_id,sub_category_id,category_id};
            await Common.executeQuery("UPDATE tbl_product SET ? WHERE id=?",[updateData,product_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "product_updated_succesfully" });
        } catch (error) {
            console.log("Error in adding product: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },

    async add_combination(req, res) {
        try {
            let { product_id, combinations } = req.body;

            const valuesToInsert = [];
            const flatParams = [];

            for (const comb of combinations) {
            const { size_id, color_id, price, stock = 1 } = comb;

            const check = await Common.executeQuery(`SELECT id FROM tbl_product_combination WHERE product_id = ? AND size_list_id = ? AND color_id = ? AND is_deleted = 0`,[product_id, size_id, color_id]);

            if (check.length === 0) {
                valuesToInsert.push("(?, ?, ?, ?, ?)");
                flatParams.push(size_id, product_id, color_id, price, stock);
            }
            }

            if (valuesToInsert.length === 0) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                keyword: "all_combinations_already_exist"
            });
            }

            const insertCombQuery = `
            INSERT INTO tbl_product_combination
            (size_list_id, product_id, color_id, price, stock)
            VALUES ${valuesToInsert.join(", ")}
            `;

            await Common.executeQuery(insertCombQuery, flatParams);

            return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
            keyword: "product_combination_added_successfully"
            });

        } catch (error) {
            console.error("Error in adding combination:", error);
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
            keyword: "internal_error"
            }, error);
        }
    },

    async delete_combination(req,res){
        try {
            let {combination_id}=req.body;
            await Common.executeQuery("UPDATE tbl_product_combination SET is_deleted=1 WHERE id=?",[combination_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "product_combination_deleted_succesfully" });
        } catch (error) {
            console.log("Error in deleting combination: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async edit_combination(req,res){
        try {
            let {combination_id,price,stock}=req.body;
            const fields = [];
            const values = [];

            if (price !== undefined) {
            if (isNaN(price) || price <= 0) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "invalid_price" });
            }
            fields.push("price = ?");
            values.push(price);
            }

            if (stock !== undefined) {
            if (!Number.isInteger(stock) || stock < 0) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "invalid_stock" });
            }
            fields.push("stock = ?");
            values.push(stock);
            }

            if (fields.length === 0) {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, { keyword: "nothing_to_update" });
            }

            values.push(combination_id);

            const updateQuery = `
            UPDATE tbl_product_combination
            SET ${fields.join(", ")}
            WHERE id = ? AND is_deleted = 0
            `;

            const result = await Common.executeQuery(updateQuery, values);

            if (result.affectedRows === 0) {
            return middleware.sendResponse(req, res, 200, ResponseCode.NOT_FOUND, { keyword: "combination_not_found" });
            }

            return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
            keyword: "product_combination_updated_successfully"
            });
        } catch (error) {
            console.log("Error in editing combination: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async add_category(req,res){
        try {
            let {name}=req.body;
            let checkExisting=await Common.executeQuery("SELECT id FROM tbl_category WHERE is_active=1 AND is_deleted=0 AND is_main_category=1 AND name=?",[name]);
            if(checkExisting.length>0){
                return middleware.sendResponse(req, res,200, ResponseCode.DUPLICATE_VALUE, { keyword: "category_already exists" });
            }
            await Common.executeQuery("INSERT INTO tbl_category (name,is_main_category) VALUES (?,1)",[name]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "category_added_successfully" });
        } catch (error) {
            console.log("Error in adding category: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async delete_category(req,res){
        try {
            let {category_id}=req.body;
            await Common.executeQuery("UPDATE tbl_category SET is_deleted=0 WHERE id=?",[category_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "category_deleted_successfully" });
        } catch (error) {
            console.log("Error in deleting category: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async add_sub_category(req,res){
        try {
            let {name,category_id,size_group_id}=req.body;
            let checkExisting=await Common.executeQuery("SELECT id FROM tbl_category WHERE is_active=1 AND is_deleted=0 AND is_main_category=0 AND parent_category_id=? AND size_group_id=? AND name=?",[category_id,size_group_id,name]);
            if(checkExisting.length>0){
                return middleware.sendResponse(req, res,200, ResponseCode.DUPLICATE_VALUE, { keyword: "sub_category_already_exists" });
            }
            await Common.executeQuery("INSERT INTO tbl_category (name,is_main_category,parent_category_id,size_group_id) VALUES (?,0,?,?)",[name,category_id,size_group_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "sub_category_added_successfully" });
        } catch (error) {
            console.log("Error in adding sub category: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async delete_sub_category(req,res){
        try {
            let {sub_category_id}=req.body;
            await Common.executeQuery("UPDATE tbl_category SET is_deleted=1 WHERE id=?",[sub_category_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "sub_category_deleted_successfully" });
        } catch (error) {
            console.log("Error in deleting sub category: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async fetch_size_group(req,res){
        try {
            let sizeGroupRes=await Common.executeQuery("SELECT id,size_group FROM tbl_size_group WHERE is_active=1 AND is_deleted=0");
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "size_group_fetched_successfully" },sizeGroupRes);
        } catch (error) {
            console.log("Error in fetching size group: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async add_size_group(req,res){
        try {
            let {size_group}=req.body;
            let checkExisting=await Common.executeQuery("SELECT id FROM tbl_size_group WHERE is_active=1 AND is_deleted=0 AND size_group=?",[size_group]);
            if(checkExisting.length>0){
                return middleware.sendResponse(req, res,200, ResponseCode.DUPLICATE_VALUE, { keyword: "size_group_already exists" });
            }
            await Common.executeQuery("INSERT INTO tbl_size_group (size_group) VALUES (?)",[size_group]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "size_group_added_successfully" });
        } catch (error) {
            console.log("Error in adding size group: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async fetch_size_list(req,res){
        try {
            let {size_group_id}=req.body;
            let sizelistRes=await Common.executeQuery("SELECT id,size FROM tbl_size_list WHERE size_group_id=? AND is_active=1 AND is_deleted=0",[size_group_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "size_list_fetched_successfully" },sizelistRes);
        } catch (error) {
            console.log("Error in fetching size list: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async add_size_list(req,res){
        try {
            let {size,size_group_id}=req.body;
            let checkExisting=await Common.executeQuery("SELECT id FROM tbl_size_list WHERE is_active=1 AND is_deleted=0 AND size=? AND size_group_id=?",[size,size_group_id]);
            if(checkExisting.length>0){
                return middleware.sendResponse(req, res,200, ResponseCode.DUPLICATE_VALUE, { keyword: "size_list_already exists" });
            }
            await Common.executeQuery("INSERT INTO tbl_size_list (size,size_group_id) VALUES (?,?)",[size,size_group_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "size_list_added_successfully" });
        } catch (error) {
            console.log("Error in adding size list: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async add_color(req,res){
        try {
            let {color}=req.body;
            let checkExisting=await Common.executeQuery("SELECT id FROM tbl_color WHERE is_active=1 AND is_deleted=0 AND color=?",[color]);
            if(checkExisting.length>0){
                return middleware.sendResponse(req, res,200, ResponseCode.DUPLICATE_VALUE, { keyword: "color_already exists" });
            }
            await Common.executeQuery("INSERT INTO tbl_color (color) VALUES (?)",[color]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "color_added_successfully" });
        } catch (error) {
            console.log("Error in adding color: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
     async add_brand(req,res){
        try {
            let {name}=req.body;
            let checkExisting=await Common.executeQuery("SELECT id FROM tbl_brand WHERE is_active=1 AND is_deleted=0 AND name=?",[name]);
            if(checkExisting.length>0){
                return middleware.sendResponse(req, res,200, ResponseCode.DUPLICATE_VALUE, { keyword: "brand_already exists" });
            }
            await Common.executeQuery("INSERT INTO tbl_brand (name) VALUES (?)",[name]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "brand_added_successfully" });
        } catch (error) {
            console.log("Error in adding brand: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async fetch_brand(req,res){
        try {
            let brands=await Common.executeQuery("SELECT id,name FROM tbl_brand WHERE is_active=1 AND is_deleted=0");
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "brand_fetched_successfully" },brands);
        } catch (error) {
            console.log("Error in adding brand: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async add_collection(req,res){
        try {
            let {name,description}=req.body;
            let checkExisting=await Common.executeQuery("SELECT id FROM tbl_collection WHERE name=? AND description=?",[name,description]);
            if(checkExisting.length>0){
                return middleware.sendResponse(req, res,200, ResponseCode.DUPLICATE_VALUE, { keyword: "brand_already exists" });
            }
            await Common.executeQuery("INSERT INTO tbl_collection (name,description) VALUES (?,?)",[name,description]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "collection_added_successfully" });
        } catch (error) {
            console.log("Error in adding collection: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async delete_collection(req,res){
        try {
            let {collection_id}=req.body;
            await Common.executeQuery("UPDATE tbl_collection SET is_deleted=1 WHERE id=?",[collection_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "collection_deleted_successfully" });
        } catch (error) {
            console.log("Error in deleting collection: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async add_product_in_collection(req,res){
        try {
            let {product_id,collection_id}=req.body;
            let checkExisting=await Common.executeQuery("SELECT id FROM tbl_product_collection WHERE is_active=1 AND is_deleted=0 AND product_id=? AND collection_id=?",[product_id,collection_id]);
            if(checkExisting.length>0){
                return middleware.sendResponse(req, res,200, ResponseCode.DUPLICATE_VALUE, { keyword: "product_already exists" });
            }
            await Common.executeQuery("INSERT INTO tbl_product_collection (product_id,collection_id) VALUES (?,?)",[product_id,collection_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "product_added_in_collection_successfully" });
        } catch (error) {
            console.log("Error in adding product: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },   
    async delete_product_in_collection(req,res){
        try {
            let {product_id,collection_id}=req.body;
            await Common.executeQuery("UPDATE tbl_product_collection SET is_deleted=1 WHERE product_id=? AND collection_id=?",[product_id,collection_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "product_deleted_successfully" });
        } catch (error) {
            console.log("Error in deleting product: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async update_order_status(req,res){
        try {
            let admin_id=req.user_id;
            let {order_id,status}=req.body;
            let arr=['Pending','Accepted', 'Processing', 'Shipped', 'Delivered'];
            if(!arr.includes(status)){
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "invalid_status" }, error);
            }
            let existing=await Common.executeQuery("SELECT status FROM tbl_order WHERE id=? AND is_active=1 AND is_deleted=0",[order_id]);
            let previos_status=existing[0].status;
            let previous_status_ind=arr.indexOf(previos_status);
            let new_status_ind=arr.indexOf(status);
            if(previous_status_ind>new_status_ind){
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "can't_change_to_previous_status" });
            }else if(previous_status_ind==new_status_ind){
                return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "no_change_in_order_status" });
            }
            await Common.executeQuery("UPDATE tbl_order SET status=? WHERE id=?",[status,order_id]);
            await Common.executeQuery("INSERT INTO tbl_order_status_log (order_id,status,updated_by,updated_by_id) VALUES (?,?,'Admin',?)",[order_id,status,admin_id])
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "order_status_updated_successfully" });
        } catch (error) {
            console.log("Error in deleting product: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async add_promocode(req,res){
        try {
            let {code,discount,max_discount,min_order_value,usage_limit,valid_until}=req.body;
            let checkExisting=await Common.executeQuery("SELECT id FROM tbl_promocode WHERE is_active=1 AND is_deleted=0 AND code=?",[code]);
            if(checkExisting.length>0){
                return middleware.sendResponse(req, res,200, ResponseCode.DUPLICATE_VALUE, { keyword: "product_already exists" });
            }
            await Common.executeQuery("INSERT INTO tbl_promocode (code,discount,max_discount,min_order_value,usage_limit,valid_until) VALUES (?,?,?,?,?,?)",[code,discount,max_discount,min_order_value,usage_limit,valid_until]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "promocode_added_successfully" });
        } catch (error) {
            console.log("Error in adding prodmocode: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
    async delete_promocode(req,res){
        try {
            let {code_id}=req.body;
            await Common.executeQuery("UPDATE tbl_promocode SET is_deleted=1 WHERE id=?",[code_id]);
            return middleware.sendResponse(req, res,200, ResponseCode.SUCCESS, { keyword: "promocode_deleted_successfully" });
        } catch (error) {
            console.log("Error in deleting promocode: "+error);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, { keyword: "internal_error" }, error);
        }
    },
};

module.exports=AdminModel;

