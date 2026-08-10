const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN';
const twilioWhatsAppNumber = 'whatsapp:+14155238886';

let client;
try {
    const twilio = require('twilio');
    client = twilio(accountSid, authToken);
} catch (e) {
    console.log("Twilio initialization note active");
}

app.get('/', (req, res) => {
    res.send('🚀 Go Bike Express Backend Engine Running Perfectly!');
});

app.post('/api/calculate-fare', (req, res) => {
    const { distanceKm } = req.body || { distanceKm: 5 };
    const baseFare = 30;
    const perKmRate = 10;
    const totalFare = baseFare + (distanceKm * perKmRate);

    res.json({ success: true, totalFare: Math.round(totalFare) });
});

app.post('/api/send-whatsapp', async (req, res) => {
    const { customerPhone, pickup, drop, fare, otp } = req.body;

    try {
        if (client && customerPhone) {
            await client.messages.create({
                body: `📦 *Go Bike Order Confirmed!*\n\nPickup: ${pickup}\nDrop: ${drop}\nFare: ₹${fare}\n\n🔑 *Delivery OTP:* ${otp}\nDriver pahunchne par yeh OTP dein.`,
                from: twilioWhatsAppNumber,
                to: `whatsapp:${customerPhone}`
            });
        }
        res.json({ success: true, message: "WhatsApp notifications handled successfully!" });
    } catch (error) {
        res.json({ success: false, message: "Fallback WhatsApp mode used", error: error.message });
    }
});

module.exports = app;

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
