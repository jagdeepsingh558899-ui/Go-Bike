const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Dynamic Fare Logic (Admin Controlled Settings)
let fareConfig = {
    baseFare: 30,
    perKmRate: 10,
    driverSharePercent: 80
};

// API: Live Fare Calculator
app.post('/api/calculate-fare', (req, res) => {
    const { distanceKm } = req.body;
    if (!distanceKm || distanceKm <= 0) {
        return res.status(400).json({ error: "Invalid Distance" });
    }
    
    const totalFare = fareConfig.baseFare + (distanceKm * fareConfig.perKmRate);
    const driverEarning = (totalFare * fareConfig.driverSharePercent) / 100;
    const adminCommission = totalFare - driverEarning;

    res.json({
        totalFare: Math.round(totalFare),
        driverEarning: Math.round(driverEarning),
        adminCommission: Math.round(adminCommission)
    });
});

// API: OTP Generator for Safe Delivery
app.post('/api/create-order', (req, res) => {
    const { pickup, drop, distanceKm, category } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
    const totalFare = fareConfig.baseFare + (distanceKm * fareConfig.perKmRate);

    const newOrder = {
        orderId: 'GB' + Date.now().toString().slice(-6),
        pickup,
        drop,
        distanceKm,
        category,
        totalFare,
        otp,
        status: 'PENDING'
    };

    // Live Socket Alert to Online Drivers
    io.emit('new_order_alert', newOrder);

    res.json({ success: true, order: newOrder });
});

// Real-time Socket.io Connection for Instant Notifications
io.on('connection', (socket) => {
    console.log(`⚡ Rider/Customer Connected: ${socket.id}`);

    socket.on('driver_location_update', (data) => {
        // Broadcast Driver Live Location to Customer Map
        socket.broadcast.emit('track_driver_' + data.orderId, data.coords);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Go Bike Backend Server Running on Port ${PORT}`);
});
