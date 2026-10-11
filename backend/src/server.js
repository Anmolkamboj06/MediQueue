const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

// Import middleware
const rateLimiter = require("./middleware/rateLimiter");

// Import routes
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const doctorRoutes = require("./routes/doctorRoutes");

const app = express();

// =====================================================
// SECURITY HEADERS MIDDLEWARE
// =====================================================
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
    next();
});

// =====================================================
// REQUEST LOGGING MIDDLEWARE
// =====================================================
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${duration}ms`
        );
    });
    next();
});

// =====================================================
// RATE LIMITER & STANDARD MIDDLEWARE
// =====================================================
app.use(rateLimiter);
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// HOME ROUTE & HEALTH CHECK
// =====================================================
app.get("/", (req, res) => {
    res.json({
        message: "Patient Queue Management API is running",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            message: "Database connected successfully",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});

// =====================================================
// API ROUTES
// =====================================================
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/doctors", doctorRoutes);

// =====================================================
// 404 ROUTE
// =====================================================
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

// =====================================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// =====================================================
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err.message || err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;