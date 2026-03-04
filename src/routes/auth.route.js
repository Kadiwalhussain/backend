const express = require('express');
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", authController.userRegisterController);
router.post("/resend-otp", authController.resendOtpController);
router.post("/verify-otp", authController.verifyOtpController);
router.post("/login", authController.userLoginController);
router.get("/me", authMiddleware, authController.getMeController);
router.post("/logout", authController.logoutController);

module.exports = router;