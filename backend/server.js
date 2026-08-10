const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 FIX: Home Page Route (White Page & Cannot GET / Problem Solve)
app.get('/', (req, res) => {
    res.send('🚀 Go Bike Express Backend Engine Running Perfectly!');
});

// Live Price Calculation API
app.post('/api/calculate-fare', (req, res) => {
    const { distanceKm } = req.body || { distanceKm: 5 };
    const baseFare = 30;
    const perKmRate = 10;
    const totalFare = baseFare + (distanceKm * perKmRate);

    res.json({
        success: true,
        totalFare: Math.round(totalFare),
        message: "Fare calculated successfully"
    });
});

// Vercel Serverless Export
module.exports = app;

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
