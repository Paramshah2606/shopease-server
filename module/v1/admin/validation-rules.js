const rules = {
  login: {
    password: "required",
    email_phone: "required",
  },
  add_product:{
    name: "required",
    description: "required",
    materials: "required",
    care: "required",
    suitable_for: "required",
    brand_id: "required",
    sub_category_id: "required",
    category_id: "required"
  },
  edit_product:{
    name: "required",
    description: "required",
    materials: "required",
    care: "required",
    suitable_for: "required",
    brand_id: "required",
    sub_category_id: "required",
    category_id: "required",
    product_id: "required"
  },
  delete_product:{
    product_id: "required"
  },
  add_combination:{
    product_id: "required", 
    combinations: "required"
  },
  delete_combination:{
    combination_id:"required"
  },
  edit_combination:{
    combination_id:"required"
  },
  delete_category:{
    category_id: "required",
  },
  add_sub_category:{
    name:"required",
    category_id: "required",
    size_group_id:"required"
  },
  delete_sub_category:{
    sub_category_id: "required",
  },
  add_size_group:{
    size_group:"required",
  },
  fetch_size_list:{
    size_group_id:"required",
  },
  add_size_list:{
    size_group_id:"required",
  },
  add_color:{
    color:"required"
  },
  add_brand:{
    name:"required"
  },
  add_collection:{
    name:"required",
    description:"required"
  },
  delete_collection:{
    collection_id:"required"
  },
  add_product_in_collection:{
    collection_id:"required",
    product_id:"required"
  },
  delete_product_in_collection:{
    collection_id:"required",
    product_id:"required"
  }
};

module.exports = rules;