const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require("./cloudinary");

const userUploadDir=path.join(__dirname,'../uploads/users/');

[userUploadDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const userStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, userUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'user_images',
      resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg","image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error("Unsupported file type. Only JPEG, PNG, and PDF are allowed.");
      error.code = "UNSUPPORTED_FILE_TYPE";
      cb(error, false);
    }
  };

// const userUpload=multer({
//     storage: userStorage,
//     fileFilter: fileFilter,
//     limits: { fileSize: 5 * 1024 * 1024 } 
// })

const userUpload=multer({
    storage: cloudinaryStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } 
})

module.exports = {userUpload};