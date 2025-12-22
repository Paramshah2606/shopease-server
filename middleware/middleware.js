const Common = require("../config/common");
const ResponseCode = require("../config/response-code");
let en = require("../language/en");
let hi = require("../language/hi");
const { t } = require("localizify");
const { default: localizify } = require("localizify");
const jwt = require("jsonwebtoken");
const constant = require("../config/constant");
const api_key_backend = constant.API_KEY;

const middleware = {
  async extractHeaderLanguageAndToken(req, res, next){
    try {
      console.log("hii");
      const public=['google'];
       const reqPathPartss = req.path.split("/");
      const splitedReqPathh=reqPathPartss[5];
      if (public.includes(splitedReqPathh)) {
        return next();
      }
      console.log("Request body to decrypt", req.body);
      if (req.is('text/plain') && req.body) {
          try {
            req.body = Common.decrypt(req.body);
          } catch (error) {
            return middleware.sendResponse(req, res,500, ResponseCode.ERROR, {
              keyword: "internal_error"
          });
          }
        }

      var headerlang =
        req.headers["accept-language"] != undefined &&
        req.headers["accept-language"] != ""
          ? req.headers["accept-language"]
          : "en";

      req.lang = headerlang;

      req.language = headerlang == "en" ? en : hi;

      localizify.add("en", en).add("hi", hi).setLocale(req.lang);

      const api_key_frontend = req.headers["api_key"];
      const reqPathParts = req.path.split("/");
      console.log(reqPathParts);
      const splitedReqPath=reqPathParts[5];
      const splitedReqPathAdmin=reqPathParts[4];
      let decrypted_api_key = "";
      if (api_key_frontend) {
        decrypted_api_key = Common.decrypt(api_key_frontend);
      }
      if (api_key_backend != decrypted_api_key) {
        return middleware.sendResponse(req, res, 403, ResponseCode.ERROR, {
          keyword: "invalid_api_key",
        });
      }

      const bypass = [
        "signup",
        "signup_verification",
        "signup_updateImage",
        "upload_image",
        "upload_multiple_image",
        "resend_code",
        "login",
        "forgot_password",
        "password_verification",
        "password_change",
        "google"
      ];

      if (bypass.includes(splitedReqPath) || bypass.includes(splitedReqPathAdmin)) {
        return next();
      }

      let token = req.headers["user-token"] || req.headers["admin-token"] || req.cookies.user_token;

      if (!token) {
        return middleware.sendResponse(req, res, 401, ResponseCode.ERROR, {
          keyword: "missing_token",
        });
      }

      token = Common.decrypt(token);

      let tokeninDb=await Common.executeQuery('SELECT id FROM tbl_device WHERE user_token=? AND is_active=1 AND is_deleted=0 ORDER BY created_at DESC',token);
      if(tokeninDb.length<=0){
        return middleware.sendResponse(req, res, 401, ResponseCode.ERROR, {
          keyword: "invalid_token",
        });
      }
  
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user_id=decoded.id;
        if(decoded.role=="User"){
          req.role = decoded.role;
        }else{
          req.role=decoded.role;
        }
      } catch (err) {
        return middleware.sendResponse(req, res, 401, ResponseCode.ERROR, {
          keyword: "invalid_or_expired_token",
        });
      }
      next();
    } catch (error) {
      console.log("Error in middleware" + error);
      return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
        keyword: "internal_error",
      });
    }
  },
  sendResponse(req, res, httpstatus = 200, status, message, data = null) {
    let translated_message;
    translated_message=Common.getMessage(req.lang, message);
    let response_data = {
      code: status,
      message: translated_message,
      data: data,
    };
    console.log("Response we sent to frontend", response_data);
    let encrypted_response=Common.encrypt(response_data);
    res.status(httpstatus).send(encrypted_response);
    // res.status(httpstatus).send(response_data);
  },
  multerErrorHandler(multerMiddleware){
    return (req, res, next) => {
      multerMiddleware(req, res, function (err) {
        if (err) {
          console.log(err);
          if (err.code === "LIMIT_FILE_SIZE") {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
              keyword: "file_size_too_large",
            });
          }
          if (err.code === "UNSUPPORTED_FILE_TYPE") {
            return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
              keyword: "unsupported_file_type",
            });
          }
          return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
            keyword: "file_upload_error",
            message: err.message,
          });
        }
        next();
      });
    };
  },
};

module.exports = middleware;
