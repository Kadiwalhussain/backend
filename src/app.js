const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.route");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
	res.status(200).json({ message: "Backend is running" });
});

app.use("/auth", authRoutes);

module.exports = app;
