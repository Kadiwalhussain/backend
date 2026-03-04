const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
	createTransaction,
	createInitialFundsTransaction,
	getTransactionHistory,
	getRecentTransactions,
	getTransactionDetail
} = require("../controllers/transaction.controller");

const transactionRouter = Router();

transactionRouter.post("/transfer", authMiddleware, createTransaction);
transactionRouter.post("/initial-funds", authMiddleware, createInitialFundsTransaction);
transactionRouter.get("/history", authMiddleware, getTransactionHistory);
transactionRouter.get("/recent", authMiddleware, getRecentTransactions);
transactionRouter.get("/detail/:transactionId", authMiddleware, getTransactionDetail);

module.exports = transactionRouter;