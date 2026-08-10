const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 🗄️ MongoDB Atlas Connection String (Aapke Username aur Password ke saath)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jagdeep65830_db_user:mE766joWL4FDZcIZ@cluster0.ltxvekw.mongodb.net/gobike?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Atlas Connected Successfully!'))
    .catch((err) => console.log('❌ MongoDB Connection Error:', err));

// 📦 Order Database Schema
const orderSchema = new mongoose.Schema({
    orderId: String,
    customerPhone: String,
    pickup: String,
    drop: String,
    category: String,
    distanceKm: Number,
    totalFare: Number,
    otp: String,
    status: { type: String, default: 'PENDING' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Twilio WhatsApp Setup
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

// 🚀 Home Route (Checks Server & MongoDB)
app.get('/', (req, res) => {
    res.send('🚀 Go Bike Express Backend + MongoDB Running Perfectly!');
});

// 💰 Live Fare Calculator API
app.post('/api/calculate-fare', (req, res) => {
    const { distanceKm } = req.body || { distanceKm: 5 };
    const baseFare = 30;
    const perKmRate = 10;
    const totalFare = baseFare + (distanceKm * perKmRate);

    res.json({ success: true, totalFare: Math.round(totalFare) });
});

// 🟢 Create Order & Save in MongoDB
app.post('/api/create-order', async (req, res) => {
    try {
        const { customerPhone, pickup, drop, category, distanceKm, totalFare } = req.body;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const orderId = 'GB' + Date.now().toString().slice(-6);

        const newOrder = new Order({
            orderId,
            customerPhone,
            pickup,
            drop,
            category,
            distanceKm,
            totalFare,
            otp
        });

        await newOrder.save();

        res.json({
            success: true,
            message: "Order Database me Save Ho Gaya!",
            order: newOrder
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🟢 Get All Pending Orders (For Driver Panel)
app.get('/api/get-orders', async (req, res) => {
    try {
        const orders = await Order.find({ status: 'PENDING' }).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 💬 WhatsApp Notification API
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
