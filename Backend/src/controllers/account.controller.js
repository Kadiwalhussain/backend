const accountModel = require("../models/account.model");
const userModel = require("../models/user.model");

async function createAccountController(req, res) {
    try {
        // User is attached to req by authMiddleware
        const userId = req.user._id;

        // Check if user already has an account
        const existingAccount = await accountModel.findOne({ user: userId });
        if (existingAccount) {
            return res.status(422).json({
                success: false,
                message: "Account already exists for this user"
            });
        }

        // Create account (accountNumber is auto-generated in the model)
        const account = await accountModel.create({
            user: userId,
            currency: req.body.currency || "INR"
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            account: {
                _id: account._id,
                accountNumber: account.accountNumber,
                balance: account.balance,
                currency: account.currency,
                status: account.status
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
}

async function getAccountController(req, res) {
    try {
        const userId = req.user._id;

        const account = await accountModel.findOne({ user: userId });
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "No account found"
            });
        }

        return res.status(200).json({
            success: true,
            account
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
}

async function getBalanceController(req, res) {
    try {
        const userId = req.user._id;

        const account = await accountModel.findOne({ user: userId });
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "No account found"
            });
        }

        return res.status(200).json({
            success: true,
            balance: account.balance,
            currency: account.currency
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
}

async function lookupAccountController(req, res) {
    try {
        const query = String(req.query.query || "").trim();

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "query is required"
            });
        }

        let account = null;

        if (query.includes("@")) {
            const user = await userModel.findOne({ email: query.toLowerCase() });
            if (user) {
                account = await accountModel.findOne({ user: user._id });
            }
        } else {
            account = await accountModel.findOne({ accountNumber: query.toUpperCase() });
        }

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found"
            });
        }

        const owner = await userModel.findById(account.user).select("name email");

        return res.status(200).json({
            success: true,
            receiver: {
                _id: account._id,
                accountNumber: account.accountNumber,
                status: account.status,
                currency: account.currency,
                owner: owner ? { name: owner.name, email: owner.email } : null,
                isSelf: String(account.user) === String(req.user._id)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
}

module.exports = {
    createAccountController,
    getAccountController,
    getBalanceController,
    lookupAccountController
};