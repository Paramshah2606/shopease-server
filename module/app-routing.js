class Routing {
    v1(app) {
        const userAuthRoutes=require("./v1/user/auth/router/auth-router");
        app.use("/api/v1/user/auth", userAuthRoutes);
        const userHomeRoutes = require("./v1/user/home/router/home-router");
        app.use("/api/v1/user/home", userHomeRoutes); 
        const adminRoutes=require("./v1/admin/router/admin-router");
        app.use("/api/v1/admin",adminRoutes);
    }
}

module.exports = new Routing();