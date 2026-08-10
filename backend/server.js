const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jagdeep65830_db_user:mE766joWL4FDZcIZ@cluster0.ltxvekw.mongodb.net/gobike?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('DB Error:', err));

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

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

app.get('/', (req, res) => {
    res.send('🚀 Go Bike Express Backend + MongoDB Running Perfectly!');
});

app.post('/api/calculate-fare', (req, res) => {
    const { distanceKm } = req.body || { distanceKm: 5 };
    const totalFare = 30 + (distanceKm * 10);
    res.json({ success: true, totalFare: Math.round(totalFare) });
});

app.post('/api/create-order', async (req, res) => {
    try {
        const { customerPhone, pickup, drop, category, distanceKm, totalFare } = req.body;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const orderId = 'GB' + Date.now().toString().slice(-6);

        const newOrder = new Order({ orderId, customerPhone, pickup, drop, category, distanceKm, totalFare, otp });
        await newOrder.save();

        res.json({ success: true, message: "Order Saved!", order: newOrder });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/get-orders', async (req, res) => {
    try {
        const orders = await Order.find({ status: 'PENDING' }).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    try {
        const { orderId, otp } = req.body;
        const order = await Order.findOne({ orderId, otp });
        if (!order) return res.status(400).json({ success: false, message: "Invalid OTP" });

        order.status = 'DELIVERED';
        await order.save();
        res.json({ success: true, message: "Verified!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(5000, () => console.log('Server running on 5000'));
}
