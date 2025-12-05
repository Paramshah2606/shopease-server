// sendOtpWhatsApp.js
const twilio = require('twilio');
const constants=require("./constant");

// Replace with your actual credentials
const accountSid = constants.ACCOUNT_SID_TWILIO;
const authToken = constants.AUTH_TOKEN_TWILIO;
const client = twilio(accountSid, authToken);

// Function to send OTP
const sendOtpViaWhatsApp = async (phoneNumber, otp) => {
  try {
    const message = await client.messages.create({
      body: `🔐 Your OTP is: ${otp}\nThis is valid for 5 minutes.`,
      from: 'whatsapp:+14155238886',       // Twilio Sandbox WhatsApp number
      to: `whatsapp:+91${phoneNumber}`        // E.g., whatsapp:+91XXXXXXXXXX
    });

    console.log('✅ OTP sent. SID:', message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('❌ Failed to send OTP:', error.message);
    return { success: false, error: error.message };
  }
};

const sendOtp = async (otp) => {
  try {
    const message = await  client.messages
    .create({
        body: `Hello this is your verification code ${otp}`,
        from: '+19159004289',
        to: '+917041999597'
    })
    console.log('✅ OTP sent. SID:', message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('❌ Failed to send OTP:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOtpViaWhatsApp,sendOtp };
