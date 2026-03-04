const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, "From account is required"]
    },

    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, "To account is required"]
    },

    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0.01, "Amount must be greater than zero"]
    },

    currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: null
    },

    status: {
        type: String,
        enum: {
            values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
            message: "Status must be PENDING, COMPLETED, FAILED, or REVERSED"
        },
        default: "PENDING"
    },

    emailNotificationStatus: {
        type: String,
        enum: {
            values: ["PENDING", "SENT", "FAILED", "UNKNOWN"],
            message: "emailNotificationStatus must be PENDING, SENT, FAILED, or UNKNOWN"
        },
        default: "PENDING"
    },

    idempotencyKey: {
        type: String,
        required: [true, "Idempotency key is required"],
        unique: true,
        trim: true
    }

}, {
    timestamps: true
});

const transactionModel = mongoose.model('Transaction', transactionSchema);
module.exports = transactionModel;
