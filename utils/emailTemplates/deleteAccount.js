const deleteAccountTemplate = (userName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 30px auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.15); }
            .header { background: #004080; padding: 20px; text-align: center; color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 12px 12px 0 0; }
            .content { padding: 25px; text-align: center; color: #333333; font-size: 16px; line-height: 1.7; }
            .highlight { color: #004080; font-weight: bold; }
            .footer { font-size: 13px; color: #666666; text-align: center; padding: 15px; margin-top: 20px; border-top: 1px solid #dddddd; }
            .footer a { color: #ff6600; text-decoration: none; font-weight: bold; }
            .footer a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                Your Cargo Account Has Been Deleted 🚛  
            </div>
            <div class="content">
                <p>Hi <span class="highlight">${userName}</span>,</p>
                <p>Your Cargo account has been successfully deleted as per your request.</p>
                <p>We're sorry to see you go. If this was a mistake or you wish to use our services again, you can always create a new account.</p>
                <p>If you have any questions, feel free to <a href="mailto:support@cargo.com">contact our support team</a>.</p>
            </div>
            <div class="footer">
                &copy; 2025 Cargo. All rights reserved. | Need help? <a href="mailto:support@cargo.com">Support</a>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = deleteAccountTemplate;
