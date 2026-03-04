const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, "Account is required"],
        index: true
    },

    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: [true, "Transaction reference is required"]
    },

    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0.01, "Amount must be greater than zero"]
    },

    balance: {
        type: Number,
        default: null
    },

    currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: null
    },

    type: {
        type: String,
        enum: {
            values: ["DEBIT", "CREDIT"],
            message: "Type must be either DEBIT or CREDIT"
        },
        required: [true, "Ledger entry type is required"]
    },

    status: {
        type: String,
        enum: {
            values: ["PENDING", "COMPLETED", "FAILED"],
            message: "Status must be PENDING, COMPLETED, or FAILED"
        },
        default: "COMPLETED"
    }

}, {
    timestamps: true
});

const ledgerModel = mongoose.model('Ledger', ledgerSchema);
module.exports = ledgerModel;