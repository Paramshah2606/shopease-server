const cloudinary = require('cloudinary').v2;
const constant=require("../config/constant");

cloudinary.config({
  cloud_name: constant.cloud_name,
  api_key: constant.cloud_api_key,
  api_secret: constant.cloud_api_secret
});

module.exports = cloudinary;