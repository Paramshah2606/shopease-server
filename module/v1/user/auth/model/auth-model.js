const Common = require("../../../../../config/common.js")
const ResponseCode = require("../../../../../config/response-code.js");
const constant=require("../../../../../config/constant.js");
const signupTemplate = require("../../../../../utils/emailTemplates/signup.js");
const verificationTemplate = require("../../../../../utils/emailTemplates/verficationCode.js");
const resetPasswordTemplate = require("../../../../../utils/emailTemplates/resetPassword.js");
const deleteAccountTemplate = require("../../../../../utils/emailTemplates/deleteAccount.js");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const middleware = require("../../../../../middleware/middleware.js");
const axios = require("axios");

const AuthModel = {
    async signup(req, res) {
        try {
            const {
                login_type,
                email,
                country_code,
                phone,
                full_name,
                password,
                social_id,
            } = req.body;

            let existingUser = await Common.executeQuery(
                "SELECT id, is_active, is_deleted, login_type FROM tbl_user WHERE (email = ? OR phone = ?) ORDER BY created_at DESC",
                [email, phone]
            );
            if (existingUser.length > 0) {
                let user = existingUser[0];

                if (user.is_active === 0) {
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                        keyword: "user_blocked",
                    });
                }

                if (user.is_deleted === 0) {
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                        keyword: "user_already_exists",
                    });
                }
            }

            let hashed_password;
            if (password) {
                hashed_password = await bcrypt.hash(password, saltRounds);
            }

            let signup_step = "1";
            if (login_type != "N") {
                signup_step = "3";
            }

            let insertUserQuery = `INSERT INTO tbl_user (login_type, email, country_code, phone, full_name, social_id,password,signup_step) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            let insertUserParams = [
                login_type,
                email,
                country_code,
                phone,
                full_name,
                social_id,
                hashed_password,
                signup_step,
            ];

            let userInsertResult = await Common.executeQuery(
                insertUserQuery,
                insertUserParams
            );
            let user_id = userInsertResult.insertId;

            if (email) {
                if (login_type == "N") {
                    let code = await Common.generateCode(user_id);
                    Common.sendMail(
                        "Signup Successful! Start Exploring Cargo ",
                        email,
                        verificationTemplate(full_name, code)
                    );
                } else {
                    Common.sendMail(
                        "Signup Successful! Start Exploring Cargo ",
                        email,
                        signupTemplate(
                            full_name,
                            "http://localhost:3000/api/user/home"
                        )
                    );
                }
            }

            if(login_type!='N'){
                 const user_token = Common.generateJWTToken(payload);

                Common.updateTokenInDb(user_id, user_token);
                const token = Common.encrypt(user_token);

                res.cookie("user_token", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: 24 * 60 * 60 * 1000,
                });

                return res.redirect("http://localhost:3000/social-login-success");
            }

            const user = {
                user_id,
                email,
                phone,
                country_code,
                login_type,
                full_name,
            };

            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.SUCCESS,
                { keyword: "signup_success" },
                user
            );
        } catch (error) {
            console.error("Signup error: ", error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },

    async signup_updateImage(req, res) {
        try {
            let { user_id, profile_photo } = req.body;
            const fetchSignupStepQuery =
                "SELECT signup_step FROM tbl_user WHERE id = ? AND is_active=1 AND is_deleted=0";
            let fetchSignupStepRes = await Common.executeQuery(fetchSignupStepQuery, [
                user_id,
            ]);
            console.log(fetchSignupStepRes);
            let signup_step = fetchSignupStepRes[0].signup_step;
            if (signup_step == 2) {
                let uploadPhotoQuery = `UPDATE tbl_user SET profile_photo=?,signup_step='3' WHERE id=?`;
                let uploadPhotoParams = [profile_photo, user_id];
                await Common.executeQuery(uploadPhotoQuery, uploadPhotoParams);
                const role = "user";
                const payload = { id: user_id, role };
                const user_token = Common.generateJWTToken(payload);

                Common.updateTokenInDb(user_id, user_token);
                const token = Common.encrypt(user_token);

                res.cookie("user_token", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: 24 * 60 * 60 * 1000,
                });
                return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                    keyword: "profile_photo_uploaded",
                });
            } else {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "access_denied",
                });
            }
        } catch (error) {
            console.error("Photo Upload error: ", error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },

    async signup_verification(req, res) {
        try {
            const { code, user_id } = req.body;
            const userdata = [code, user_id];

            const fetchSignupStepQuery =
                "SELECT signup_step,email,full_name FROM tbl_user WHERE id = ? AND is_active=1 AND is_deleted=0";
            let fetchSignupStepRes = await Common.executeQuery(
                fetchSignupStepQuery,
                user_id
            );
            let signup_step = fetchSignupStepRes[0].signup_step;
            let email = fetchSignupStepRes[0].email;
            let full_name = fetchSignupStepRes[0].full_name;

            if (signup_step == 1) {
                let user_verified = await Common.verifyUser(userdata);

                if (user_verified === 0) {
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                        keyword: "verification_failed",
                    });
                } else if (user_verified === 1) {
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                        keyword: "verification_code_match_error",
                    });
                }

                let stepUpdate = await Common.updateSignupStep("2", user_id);
                if (!stepUpdate) {
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                        keyword: "internal_error",
                    });
                }

                Common.sendMail(
                    "Signup Successful! Start Exploring Cargo ",
                    email,
                    signupTemplate(
                        full_name,
                        "http://localhost:8080/api/v1/user/find_ride"
                    )
                );

                return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                    keyword: "verification_success",
                });
            } else {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "access_denied",
                });
            }
        } catch (error) {
            console.error("Signup Verification error: ", error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "signup_profile_internal_error" },
                error
            );
        }
    },

    async resend_code(req, res) {
        try {
            const { user_id } = req.body;
            let q = `SELECT full_name,email FROM tbl_user WHERE is_active=1 AND is_deleted=0 AND id=?`;
            let res0 = await Common.executeQuery(q, [user_id]);
            let code = await Common.generateCode(user_id);
            if (res0[0].email) {
                Common.sendMail(
                    "Signup Successful! Start Exploring Cargo ",
                    res0[0].email,
                    verificationTemplate(res0[0].full_name, code)
                );
            }
            return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                keyword: "code_resend_success",
            });
        } catch (error) {
            console.log(error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "verification_code_generation_error" },
                error
            );
        }
    },

    async login(req, res) {
        try {
            const { social_id, login_type, email_phone, password } = req.body;
            let loginUserQuery = `SELECT id,password,full_name,signup_step,role FROM tbl_user WHERE (phone = ? OR email=?) AND is_active=1 AND is_deleted=0`;
            let loginUserQueryParam = [email_phone, email_phone];
            if (login_type != "N") {
                loginUserQuery = `SELECT id FROM tbl_user WHERE social_id=? AND is_active=1 AND is_deleted=0`;
                loginUserQueryParam = [social_id];
            }
            let loginUserResult = await Common.executeQuery(
                loginUserQuery,
                loginUserQueryParam
            );
            if (loginUserResult.length === 0 && login_type != "N") {
                return middleware.sendResponse(
                    req,
                    res,
                    200,
                    ResponseCode.DATA_NOT_FOUND,
                    { keyword: "social_id_not_registered" }
                );
            } else if (loginUserResult.length === 0) {
                return middleware.sendResponse(
                    req,
                    res,
                    200,
                    ResponseCode.DATA_NOT_FOUND,
                    { keyword: "user_not_registered" }
                );
            } else {
                let user_id = loginUserResult[0].id;
                const signup_step = loginUserResult[0].signup_step;
                const full_name = loginUserResult[0].full_name;
                if (login_type === "N") {
                    const isMatch = await bcrypt.compare(
                        password,
                        loginUserResult[0].password
                    );
                    if (!isMatch) {
                        return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                            keyword: "login_incorrect_password",
                        });
                    }
                    if (signup_step == 1) {
                        Common.generateCode(user_id);
                    }
                    if (signup_step != 3) {
                        return middleware.sendResponse(
                            req,
                            res,
                            200,
                            ResponseCode.ERROR,
                            { keyword: "signup_step_pending" },
                            { signup_step, user_id }
                        );
                    }
                }
                const role = loginUserResult[0].role;
                const payload = { id: user_id, email_phone, role };
                const user_token = Common.generateJWTToken(payload);

                await Common.updateTokenInDb(user_id, user_token);

                const token = Common.encrypt(user_token);

                res.cookie("user_token", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: 24 * 60 * 60 * 1000,
                });

                if(social_id){
                    return res.redirect("http://localhost:3000/social-login-success");
                }

                
                return middleware.sendResponse(
                    req,
                    res,
                    200,
                    ResponseCode.SUCCESS,
                    { keyword: "login_normal_success" },
                    { signup_step }
                );
            }
        } catch (error) {
            console.log(error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },

    async logout(req, res) {
        try {
            let user_id = req.user_id;
            let q = `UPDATE tbl_device SET user_token=NULL,device_token=NULL WHERE user_id=?`;
            await Common.executeQuery(q, user_id);
            res.clearCookie("user_token");
            return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                keyword: "user_logged_out",
            });
        } catch (error) {
            console.log("Error in logout" + error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },

    async forgot_password(req, res) {
        try {
            const { phone, email } = req.body;
            if (!email && !phone) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "no_email_phone",
                });
            }

            let query = `SELECT id, login_type,full_name FROM tbl_user WHERE (phone = ? OR email=?) AND is_active = 1 AND is_deleted = 0`;
            let result = await Common.executeQuery(query, [phone, email]);

            if (result.length === 0) {
                return middleware.sendResponse(
                    req,
                    res,
                    200,
                    ResponseCode.DATA_NOT_FOUND,
                    { keyword: "forgot_password_user_not_found" }
                );
            }

            if (
                result[0].login_type === "F" ||
                result[0].login_type === "G" ||
                result[0].login_type === "A"
            ) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "forgot_password_social_login",
                });
            }
            let user_id = result[0].id;
            let full_name = result[0].full_name;
            if (email) {
                const resetToken = await Common.generateResetToken(user_id);

                const resetLink = `http://localhost:8080/reset-password?token=${resetToken}`;
                console.log("Generated Reset Password Link:", resetLink);

                const subject = "Reset Your Password";

                Common.sendMail(
                    subject,
                    email,
                    resetPasswordTemplate(full_name, resetLink)
                );
                return middleware.sendResponse(
                    req,
                    res,
                    200,
                    ResponseCode.SUCCESS,
                    { keyword: "verification_successful" },
                    { resetLink, resetToken }
                );
            } else {
                let code = await Common.generateCode(result[0].id);
                return middleware.sendResponse(
                    req,
                    res,
                    200,
                    ResponseCode.SUCCESS,
                    { keyword: "forgot_password_verification" },
                    { user_id }
                );
            }
        } catch (error) {
            console.log("Error in forgot password" + error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },

    async password_verification(req, res) {
        try {
            let { user_id, code } = req.body;
            if (!user_id) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "no_user_id",
                });
            }
            let query = `SELECT login_type,full_name FROM tbl_user WHERE id = ? AND is_active = 1 AND is_deleted = 0`;
            let result = await Common.executeQuery(query, [user_id]);
            if (result.length === 0) {
                return middleware.sendResponse(
                    req,
                    res,
                    200,
                    ResponseCode.DATA_NOT_FOUND,
                    { keyword: "forgot_password_user_not_found" }
                );
            }
            if (
                result[0].login_type === "F" ||
                result[0].login_type === "G" ||
                result[0].login_type === "A"
            ) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "forgot_password_social_login",
                });
            }

            const full_name = result[0].full_name;
            const userdata = [code, user_id];

            let user_verified = await Common.verifyUser(userdata);

            if (user_verified === 0) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "verification_failed",
                });
            } else if (user_verified === 1) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "verification_code_match_error",
                });
            } else {
                const resetToken = await Common.generateResetToken(user_id);
                return middleware.sendResponse(
                    req,
                    res,
                    200,
                    ResponseCode.SUCCESS,
                    { keyword: "verification_successful" },
                    { resetToken }
                );
            }
        } catch (error) {
            console.log("Error in forgot password verification" + error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },

    async password_change(req, res) {
        try {
            let { password, passwordConfirm, token } = req.body;
            if (password != passwordConfirm) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "password_confirm_password_not_matching",
                });
            }
            let fetchtoken = await Common.executeQuery(
                "SELECT user_id FROM tbl_reset_password WHERE token=?",
                token
            );
            if (fetchtoken.length == 0) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "invalid_inactive_token",
                });
            }
            let user_id = fetchtoken[0].user_id;
            let query = `SELECT password,login_type FROM tbl_user WHERE id=? AND is_active = 1 AND is_deleted = 0`;
            let result = await Common.executeQuery(query, [user_id]);

            if (result.length === 0) {
                return middleware.sendResponse(
                    req,
                    res,
                    200,
                    ResponseCode.DATA_NOT_FOUND,
                    { keyword: "forgot_password_user_not_found" }
                );
            }
            if (
                result[0].login_type === "F" ||
                result[0].login_type === "G" ||
                result[0].login_type === "A"
            ) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "forgot_password_social_login",
                });
            }
            if (!password) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "password_required",
                });
            }
            const isMatch = await bcrypt.compare(password, result[0].password);
            if (isMatch) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "passwords_same",
                });
            }

            let hashed_password;
            if (password) {
                hashed_password = await bcrypt.hash(password, saltRounds);
            }

            const query2 =
                "UPDATE tbl_user SET password=? WHERE id=? AND is_active=1 AND is_deleted=0";
            await Common.executeQuery(query2, [hashed_password, user_id]);

            await Common.executeQuery(
                "DELETE FROM tbl_reset_password WHERE user_id=?",
                [user_id]
            );

            return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                keyword: "password_update_success",
            });
        } catch (error) {
            console.log("Error in forgot password change" + error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },

    async reset_password(req, res) {
        try {
            const { old_password, new_password } = req.body;
            const user_id = req.user_id;

            const q1 =
                "SELECT password,login_type FROM tbl_user WHERE id=? AND is_active=1 AND is_deleted=0";
            let res1 = await Common.executeQuery(q1, user_id);
            if (
                res1[0].login_type === "F" ||
                res1[0].login_type === "G" ||
                res1[0].login_type === "A"
            ) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "forgot_password_social_login",
                });
            }

            if (!old_password || !new_password) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "passwords_required",
                });
            } else if (old_password === new_password) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "passwords_same",
                });
            }

            const user_password = res1[0]?.password;
            console.log("USer kaaa password", user_password);
            console.log("Puranaa password", old_password);

            if (!user_password) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "incorrect_olddd_password",
                });
            }
            const isMatch = await bcrypt.compare(old_password, user_password);
            if (!isMatch) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "incorrect_old_password",
                });
            }

            let hashed_password;
            if (new_password) {
                hashed_password = await bcrypt.hash(new_password, saltRounds);
            }

            const q2 = "UPDATE tbl_user SET password=? WHERE id=?";
            const args = [hashed_password, user_id];
            await Common.executeQuery(q2, args);

            return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                keyword: "password_update_success",
            });
        } catch (error) {
            console.log("Error in reset password" + error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },

    async delete_account(req, res) {
        try {
            let user_id = req.user_id;
            let [userDetail] = await Common.executeQuery(
                "SELECT full_name,email FROM tbl_user WHERE id=?",
                [user_id]
            );
            let email = userDetail.email;
            let full_name = userDetail.full_name;
            await Common.executeQuery(
                "UPDATE tbl_user SET is_deleted=1,signup_step='1' WHERE id=?",
                user_id
            );
            await Common.executeQuery(
                "UPDATE tbl_device SET is_deleted=1 WHERE user_id=?",
                user_id
            );
            await Common.sendMail(
                "Your Cargo Account Has Been Deleted",
                email,
                deleteAccountTemplate(full_name)
            );
            res.clearCookie("user_token");
            return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                keyword: "account_deleted",
            });
        } catch (error) {
            console.log("Error in delete account" + error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },

    async edit_profile(req, res) {
        try {
            let user_id = req.user_id;
            console.log(user_id);
            let { full_name, email, phone, profile_photo } = req.body;
            console.log(profile_photo);
            let updatedata = {};
            if (full_name !== undefined) {
                updatedata.full_name = full_name;
            }
            if (email !== undefined) {
                updatedata.email = email;
            }
            if (phone !== undefined) {
                updatedata.phone = phone;
            }
            if (profile_photo !== undefined) {
                updatedata.profile_photo = profile_photo;
            }
            if (Object.keys(updatedata).length === 0) {
                return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                    keyword: "nothing_to_update",
                });
            }
            console.log(updatedata);
            let q = "UPDATE tbl_user SET ? WHERE id=?";
            await Common.executeQuery(q, [updatedata, user_id]);
            console.log(q);

            return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                keyword: "user_updated",
            });
        } catch (error) {
            console.log("Error in edit profile" + error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },
    async upload_images(req, res, files) {
        try {
            let image = "";
            if (files.image) {
                image = files.image[0].path;
            }
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.SUCCESS,
                { keyword: "image added successfully" },
                { image }
            );
        } catch (error) {
            console.log("Error in uploading images" + error);
            return middleware.sendResponse(
                req,
                res,
                500,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },
    async upload_multiple_images(req, res, files) {
        try {
            let arr = [];
            if (files.images) {
                arr = files.images;
            }
            let images_arr = [];
            for (let i = 0; i < arr.length; i++) {
                let media_url = arr[i].path;
                let media_type = arr[i].mimetype;
                let data = {
                    media_url,
                    media_type,
                };
                images_arr.push(data);
            }
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.SUCCESS,
                { keyword: "Images added successfully" },
                { images: images_arr }
            );
        } catch (error) {
            console.log("Error in uploading multiple images" + error);
            return middleware.sendResponse(
                req,
                res,
                500,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },
    async fetch_user_detail(req, res) {
        try {
            let user_id = req.user_id;
            let [userDetail] = await Common.executeQuery(
                "SELECT full_name,email,phone,profile_photo,login_type FROM tbl_user WHERE id=? AND is_active=1 AND is_deleted=0",
                [user_id]
            );
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.SUCCESS,
                { keyword: "user_details_fetched_successfully" },
                { user: userDetail }
            );
        } catch (error) {
            console.log("Error in fetching user detail" + error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },
    async update_phone_email(req, res) {
        try {
            let user_id = req.user_id;
            let { action, email } = req.body;
            if (action == "G") {
                let code = await Common.generateCode(user_id);
                if (email) {
                    Common.sendMail(
                        "Signup Successful! Start Exploring Cargo ",
                        email,
                        verificationTemplate("User", code)
                    );
                }
                return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                    keyword: "verification_code_generated_successfully",
                });
            } else if (action == "V") {
                let { phone, code } = req.body;
                if (!phone && !email) {
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                        keyword: "phone_or_email_required",
                    });
                }
                let user_verified = Common.verifyUser([code, user_id]);
                if (user_verified === 0) {
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                        keyword: "verification_failed",
                    });
                } else if (user_verified === 1) {
                    return middleware.sendResponse(req, res, 200, ResponseCode.ERROR, {
                        keyword: "verification_code_match_error",
                    });
                }
                if (phone) {
                    await Common.executeQuery("UPDATE tbl_user SET phone=? WHERE id=?", [
                        phone,
                        user_id,
                    ]);
                    return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                        keyword: "phone_updated_successfully",
                    });
                }
                if (email) {
                    await Common.executeQuery("UPDATE tbl_user SET email=? WHERE id=?", [
                        email,
                        user_id,
                    ]);
                    return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                        keyword: "email_updated_successfully",
                    });
                }
            }
        } catch (error) {
            console.log("Error in fetching user detail" + error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },




    async google(req, res) {
        try {
            const scope = [
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile"
            ].join(" ");

             const params = new URLSearchParams({
                client_id: constant.GOOGLE_CLIENT_ID,
                redirect_uri: constant.GOOGLE_REDIRECT_URI,
                response_type: "code",
                scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email"
                ].join(" "),
                access_type: "offline",
                prompt: "consent"
            }).toString();

            let loginurl=`https://accounts.google.com/o/oauth2/v2/auth?${params}`;
            return middleware.sendResponse(req, res, 200, ResponseCode.SUCCESS, {
                        keyword: "login_url_generated",
                    },{redirecturl:loginurl});
        } catch (error) {
            console.log("Error in generating url" + error);
            return middleware.sendResponse(
                req,
                res,
                200,
                ResponseCode.ERROR,
                { keyword: "internal_error" },
                error
            );
        }
    },

    async google_callback(req, res) {
        const code = req.query.code;

        try {
            // Step 1: Exchange code for tokens
            const tokenResponse = await axios.post(
                "https://oauth2.googleapis.com/token",
                {
                    code,
                    client_id: constant.GOOGLE_CLIENT_ID,
                    client_secret: constant.GOOGLE_CLIENT_SECRET,
                    redirect_uri: constant.GOOGLE_REDIRECT_URI,
                    grant_type: "authorization_code",

                }
            );

            const { access_token } = tokenResponse.data;

            // Step 2: Fetch user profile from Google
            const userInfoResponse = await axios.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                }
            );

            const { id, email, name, picture } = userInfoResponse.data;
            const login_type = "G";

            // Step 3: Check if user exists by social_id or email
            const userCheckQuery = `
      SELECT id FROM tbl_user 
      WHERE (social_id = ? OR email = ?) AND is_active = 1 AND is_deleted = 0
    `;
            const existingUser = await Common.executeQuery(userCheckQuery, [
                id,
                email,
            ]);

            req.body = {
                login_type,
                social_id: id,
                email:email,
                full_name: name,
                email_phone: email,
                password: null, // not needed for social login
            };

            if (existingUser.length === 0) {
                // User not found → sign them up
                return await AuthModel.signup(req, res);
            } else {
                // User found → log them in
                return await AuthModel.login(req,res);
            }
        } catch (error) {
            console.error(
                "Google Auth Error:",
                error?.response?.data || error.message
            );
            return res.redirect("http://localhost:3000/login");
        }
    },
};

module.exports = AuthModel;