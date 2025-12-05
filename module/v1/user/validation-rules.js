const rules = {
  signup_normal: {
    full_name: "required|alpha",
    country_code: "required",
    phone: "required|digits_between:6,15",
    email: "required|email",
    password: "required",
  },
  signup_social: {
    social_id: "required",
    full_name: "required|alpha",
    email: "required|email",
  },
  signup_verification: {
    code: "required",
    user_id: "required",
  },
  login: {
    login_type: "required|in:F,G,A,N",
    social_id: "required_if:login_type,F,G,A",
    password: "required_if:login_type,N",
    email_phone: "required_if:login_type,N",
  },
  password_verification: {
    code: "required",
  },
  password_change: {
    password: "required",
  },
  fetch_sub_category: {
    category_id: "required",
  },
  product_detail: {
    product_id: "required",
  },
  manage_cart: {
    product_combination_id: "required_if:action,inc,dec,del",
    action: "required|in:del,dec,inc,clear",
  },
  place_order: {
    shipping_method: "required|in:Pickup,Delivery",
    payment_method: "required|in:Card,Cod",
    shipping_address_id:"required_if:shipping_method,Delivery",
    card_id:"required_if:payment_method,Card"
  },
  add_address: {
    first_name: "required",
    last_name: "required",
    address: "required",
    city: "required",
    state: "required",
    zip: "required",
    phone: "required",
  },
  add_card:{
  name: 'required',
  card_number: 'required|digits:16',
  expiry_month: 'required',
  expiry_year: 'required|digits:2'
},
  manage_wishlist: {
    product_combination_id: "required",
  },
  blog_detail: {
    blog_id: "required",
  }
};

module.exports = rules;
