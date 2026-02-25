const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.route");

const app = express();

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
	res.status(200).json({ message: "Backend is running" });
});

app.use("/auth", authRoutes);

module.exports = app;
