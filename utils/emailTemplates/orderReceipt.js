const orderReceiptTemplate = (orderData) => {
    const {
        id,
        delivery_date_time,
        sender_address,
        receiver_name,
        receiver_email,
        receiver_country_code,
        receiver_phone,
        receiver_address,
        estimated_distance,
        estimated_delivery_time,
        price,
        pod_charge,
        tax,
        driver_name,
        driver_phone
    } = orderData;

    const formattedDistance = estimated_distance ? `${parseFloat(estimated_distance).toFixed(3)} km` : "N/A";
    const formattedDeliveryTime = estimated_delivery_time ? `${parseFloat(estimated_delivery_time).toFixed(3)} minutes` : "N/A";
    const formattedPrice = price ? `₹${parseFloat(price).toFixed(2)}` : "N/A";
    const formattedPODCharge = pod_charge ? `₹${parseFloat(pod_charge).toFixed(2)}` : "N/A";
    const formattedTax = tax ? `₹${parseFloat(tax).toFixed(2)}` : "N/A";
    const totalPrice = (parseFloat(price) + parseFloat(pod_charge) + parseFloat(tax)).toFixed(2);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 30px auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.15); }
            .header { background: #004080; padding: 20px; text-align: center; color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 12px 12px 0 0; }
            .content { padding: 25px; color: #333333; font-size: 16px; line-height: 1.7; }
            .highlight { color: #004080; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .table th, .table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .footer { font-size: 13px; color: #666666; text-align: center; padding: 15px; margin-top: 20px; border-top: 1px solid #dddddd; }
            .footer a { color: #ff6600; text-decoration: none; font-weight: bold; }
            .footer a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                Order Receipt 🧾
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>Thank you for using Cargo. Here is the receipt for your recent order.</p>
                <table class="table">
                    <tr>
                        <th>Order ID</th>
                        <td class="highlight">#${id}</td>
                    </tr>
                    <tr>
                        <th>Delivery Date & Time</th>
                        <td>${delivery_date_time}</td>
                    </tr>
                    <tr>
                        <th>Sender Address</th>
                        <td>${sender_address}</td>
                    </tr>
                    <tr>
                        <th>Receiver Name</th>
                        <td>${receiver_name}</td>
                    </tr>
                    <tr>
                        <th>Receiver Email</th>
                        <td>${receiver_email}</td>
                    </tr>
                    <tr>
                        <th>Receiver Contact</th>
                        <td>${receiver_country_code} ${receiver_phone}</td>
                    </tr>
                    <tr>
                        <th>Receiver Address</th>
                        <td>${receiver_address}</td>
                    </tr>
                    <tr>
                        <th>Estimated Distance</th>
                        <td>${formattedDistance}</td>
                    </tr>
                    <tr>
                        <th>Estimated Delivery Time</th>
                        <td>${formattedDeliveryTime}</td>
                    </tr>
                </table>

                <h3>Price Breakdown</h3>
                <table class="table">
                    <tr>
                        <th>Base Price</th>
                        <td>${formattedPrice}</td>
                    </tr>
                    <tr>
                        <th>POD Charge</th>
                        <td>${formattedPODCharge}</td>
                    </tr>
                    <tr>
                        <th>Tax</th>
                        <td>${formattedTax}</td>
                    </tr>
                    <tr>
                        <th>Total Price</th>
                        <td class="highlight">₹${totalPrice}</td>
                    </tr>
                </table>

                <h3>Driver Details</h3>
                <table class="table">
                    <tr>
                        <th>Driver Name</th>
                        <td>${driver_name}</td>
                    </tr>
                    <tr>
                        <th>Driver Contact</th>
                        <td>${driver_phone}</td>
                    </tr>
                </table>

                <p>If you have any questions regarding your order, please <a href="mailto:support@cargo.com">contact our support team</a>.</p>
            </div>
            <div class="footer">
                &copy; 2025 Cargo. All rights reserved. | Need help? <a href="mailto:support@cargo.com">Support</a>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = orderReceiptTemplate;

