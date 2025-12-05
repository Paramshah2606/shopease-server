const express=require("express");
const app=express();
const cors = require('cors');
require('dotenv').config();
const app_routing=require("./module/app-routing");
const appdoc = require("./module/v1/Api_document/route");
const constant=require("./config/constant.js");
const port = constant.PORT || 8080;
const common=require("./config/common.js");
const path = require('path');
const cookieParser = require('cookie-parser');

app.use(cors({
  origin: true,            
  credentials: true         
}));

app.use(cookieParser());

app.use("/apiDoc",appdoc);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const resetPasswordRoute = require('./routes/resetPassword.js');
app.use('/reset-password', resetPasswordRoute);
const encDecRouter = require('./routes/enc-dec');
app.use('/enc-dec', encDecRouter);
app.use(require("./middleware/middleware.js").extractHeaderLanguageAndToken);


// common.updateOrderStatus();

app_routing.v1(app);

app.listen(port, ()=>{
    console.log("Server is listening on port ",port);
})