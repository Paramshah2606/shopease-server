const connection = require("./database");
const {
    default: localizify
} = require('localizify');
let en = require("../language/en");
let hi = require('../language/hi');
const {
    t
} = require('localizify');

const Validator = require('Validator');
const moment=require("moment");
const nodemailer=require('nodemailer');
const constant=require("./constant");
require('dotenv').config();

const hash_key =constant.KEY;

const iv = constant.IV;

const crypto = require('crypto');

const jwt = require("jsonwebtoken");

const JWT_SECRET = constant.JWT_SECRET;
const JWT_EXPIRY = "7d";

const Common= {
    executeQuery(query, params){
        return new Promise((resolve, reject) => {
            connection.query(query, params, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    },
    generateJWTToken(payload){
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    },
    verifyJWTToken(token){
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return null;
        }
    },
    async checkUniqueUser(email, phone) {
        try {
            let query = "SELECT id FROM tbl_user WHERE (email=? OR phone=?) AND is_active=1 AND is_deleted=0";
            let result = await Common.executeQuery(query, [email, phone]);
            console.log(result);
            return result.length > 0; 
        } catch (error) {
            console.error("Error checking user uniqueness:", error);
            throw error; 
        }
    },
    getMessage(language, message) {
        localizify
            .add('en', en)
            .add('hi', hi)
            .setLocale(language);

        let translatedMessage = t(message.keyword);

        if (message.content) {
            Object.keys(message.content).forEach(key => {
                translatedMessage = translatedMessage.replace(`:${key}`, message.content[key]);
            });
        }

        return translatedMessage;
    },
    checkValidations(data, rules, message) {
    const v = Validator.make(data, rules, message);

    if (v.fails()) {
        const errors = v.getErrors();
        console.log(errors);
        let error = "";
        for (let key in errors) {
            error = errors[key][0];
            break;
        }
        console.log(error);
        return { success: false, error }; 
    }

    return { success: true };  
},

    // Function to generate random code
    async generateCode(id) {
       try {
        let selectExisting=await Common.executeQuery('SELECT id FROM tbl_user_verification_code WHERE is_active=1 AND is_deleted=0 AND user_id=?',[id]);
        if(selectExisting.length>0){
            await Common.executeQuery('DELETE FROM tbl_user_verification_code WHERE user_id=?',[id]);
        }
         let code = Math.floor(1000 + Math.random() * 9000);
         let query = "INSERT INTO tbl_user_verification_code (code,user_id) VALUES (?,?)"
         let arr = [code, id];
         Common.executeQuery(query,arr);
         return code;
       } catch (error) {
         console.log("Some error occured in generating otp:" + err);
       }
    },
    // Function to verify user with code 
    // Getting code and user_id from function call as args
    async verifyUser(data) {
        try {
            const code = data[0];
            const id = data[1];
            let query = "SELECT code FROM tbl_user_verification_code WHERE user_id=? AND is_active=1 AND is_deleted=0 ORDER BY created_at DESC LIMIT 1;";
            let res=await Common.executeQuery(query,id);
                console.log(res[0].code);
                if (res.length == 0) {
                    return 0;
                }
                if (res[0].code != code) {
                    return 1;
                } else {
                    let q2="DELETE FROM tbl_user_verification_code WHERE user_id=?";
                    await Common.executeQuery(q2,id);
                    return 2;
                }
        } catch (error) {
            console.log("Error when verifiying user"+error);
            return 0;
        }
    },

    encrypt(requestData) {
        try {
            if (!requestData) return null;
            const data = typeof requestData === 'object' ? JSON.stringify(requestData) : requestData;
            const cipher = crypto.createCipheriv('AES-256-CBC', hash_key, iv);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
        } catch (error) {
            console.error('Encryption error:', error);
            return error;
        }
    },
    decrypt(requestData) {
        try {
            if (!requestData) return {};
            const decipher = crypto.createDecipheriv('AES-256-CBC', hash_key, iv);
            let decrypted = decipher.update(requestData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return Common.isJson(decrypted) === true ? JSON.parse(decrypted) : decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return requestData;
        }
    },
     isJson(request_data) {
    try {
        JSON.parse(request_data);
        return true;
    } catch (error) {
        return false;
    }
},
    async sendMail(subject, to_email, message){
        try {
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: constant.mailer_email,
                    pass: constant.mailer_password
                },
                tls: {
                  rejectUnauthorized: false
                }
            });
    
            const mailOptions = {
                from: constant.from_email,
                to: to_email,
                subject: subject,
                html: message
            };
    
            const info = await transporter.sendMail(mailOptions);
            return { success: true, info }; // Return success response
    
        } catch (error) {
            console.error("Error sending email:", error);
            return { success: false, error }; // Return failure response
        }
    },
    async updateSignupStep(signup_step,user_id){
        try {
            let updateSignupStepQuery=`UPDATE tbl_user SET signup_step=? WHERE id=? AND is_active=1 AND is_deleted=0`;
            let updateSignupStepParams=[signup_step,user_id];
            let res=await Common.executeQuery(updateSignupStepQuery,updateSignupStepParams);
            console.log(res);
            return true;
        } catch (error) {
            console.log("Error in updating signup step",error);
            return false;
        }
    },
    async updateTokenInDb(user_id,user_token,role="user"){
        try {
            console.log("hii");
            let existingEntry=await Common.executeQuery("SELECT id FROM tbl_device WHERE user_id=? AND is_active=1 AND is_deleted=0",[user_id]);
            if(existingEntry.length==0){
                console.log("Insrting neww");
                await Common.executeQuery("INSERT INTO tbl_device (user_id,user_token,role) VALUES (?,?,?)",[user_id,user_token,role]);
            }else{
                console.log("Updatinggggg");
                await Common.executeQuery("UPDATE tbl_device SET user_token=? WHERE user_id=?",[user_token,user_id]);
            }
        } catch (error) {
            console.log("Error in updating token",error);
            throw error;
        }
    },
    async clearCart(user_id){
        try{
            await Common.executeQuery("DELETE FROM tbl_cart WHERE user_id=?",[user_id]);
        }catch(error){
            console.log("Error in clearing cart",error);
            throw error;
        }
    },
    generateUniqueToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 16; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
        return token;
    },
    async generateResetToken(user_id){
        const resetToken = Common.generateUniqueToken();
        const expires_at = moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss");

        const resetData = {
            user_id: user_id,
            token: resetToken,
            expiry_time: expires_at,
        };

        const resetRes=await Common.executeQuery("INSERT INTO tbl_reset_password SET ?",[resetData]);
        console.log(resetRes);
        if (!resetRes) {
            console.error("Failed to insert reset token for driver:", user_id);
            return middleware.sendResponse(req, res,200, ResponseCode.ERROR, 
                { keyword: "reset_link_generation_failed" }
            );
        }
        return resetToken;
    }
}


module.exports = Common;