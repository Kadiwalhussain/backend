const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
	createAccountController,
	getAccountController,
	getBalanceController,
	lookupAccountController
} = require("../controllers/account.controller");

const router = express.Router();

router.post("/create", authMiddleware, createAccountController);
router.get("/me", authMiddleware, getAccountController);
router.get("/balance", authMiddleware, getBalanceController);
router.get("/lookup", authMiddleware, lookupAccountController);

module.exports = router;