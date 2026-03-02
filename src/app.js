const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.route');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Root route
app.get("/", (req, res) => {
    res.json({ success: true, message: "🚀 Server is running!" });
});

// Routes
app.use("/api/auth", authRoutes);

module.exports = app;