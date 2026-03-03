const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { createAccountController, getAccountController } = require("../controllers/account.controller");

const router = express.Router();

router.post("/create", authMiddleware, createAccountController);
router.get("/me", authMiddleware, getAccountController);

module.exports = router;