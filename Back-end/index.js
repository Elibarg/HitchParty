const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const vehicleRoutes = require('./src/routes/veiculosRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const rideRoutes = require('./src/routes/caronasRotas');
const pool = require('./src/config/database');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rides', rideRoutes);

async function testDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL connected.');
        connection.release();
    } catch (error) {
        console.error('MySQL connection error:', error);
    }
}

testDatabase();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`HitchParty server running on port ${PORT}.`);
});
