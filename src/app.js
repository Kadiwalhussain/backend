const express = require("express");
const authRoutes = require("./routes/auth.route");

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
	res.status(200).json({ message: "Backend is running" });
});

app.use("/api/auth", authRoutes);

module.exports = app;
