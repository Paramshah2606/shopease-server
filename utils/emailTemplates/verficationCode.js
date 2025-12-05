const verificationTemplate = (userName, verificationCode) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 30px auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.15); }
            .header { background: #004080; padding: 20px; text-align: center; color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 12px 12px 0 0; }
            .logo { display: block; margin: 0 auto 15px; width: 120px; }
            .content { padding: 25px; text-align: center; color: #333333; font-size: 16px; line-height: 1.7; }
            .highlight { color: #004080; font-weight: bold; }
            .code-box { display: inline-block; background: #ff6600; color: #ffffff; font-size: 22px; font-weight: bold; padding: 12px 24px; border-radius: 6px; margin: 20px 0; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); }
            .footer { font-size: 13px; color: #666666; text-align: center; padding: 15px; margin-top: 20px; border-top: 1px solid #dddddd; }
            .footer a { color: #ff6600; text-decoration: none; font-weight: bold; }
            .footer a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                Verify Your Cargo Account 🚛  
            </div>
            <div class="content">
                <p>Hi <span class="highlight">${userName}</span>,</p>
                <p>Your verification code is:</p>
                <div class="code-box">${verificationCode}</div>
                <p>Please enter this code in the app to verify your email.</p>
                <p>If you didn't request this, please ignore this email or <a href="mailto:support@cargo.com">contact support</a>.</p>
            </div>
            <div class="footer">
                &copy; 2025 Cargo. All rights reserved. | Need help? <a href="mailto:support@cargo.com">Support</a>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = verificationTemplate;
