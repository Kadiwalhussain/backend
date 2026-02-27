const express = require("express");
const { registerUser, loginUser } = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔐 Protected test route
router.get("/profile", authMiddleware, (req, res) => {
    res.json({ message: "Protected route accessed", user: req.user });
});

module.exports = router;