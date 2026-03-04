const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Account must be associated with a user"],
        index: true

    },

    accountNumber: {
        type: String,
        unique: true,
        required: true,
        default: () => `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`
    },

    balance: {
        type: Number,
        default: 0,
        min: [0, "Balance cannot be negative"]
    },

    status: {
        type: String,
        enum: {
            values: ["ACTIVE", "SUSPENDED", "CLOSED"],
            message: "Status must be either ACTIVE, SUSPENDED, or CLOSED"
        },
        default: "ACTIVE"
    },

    currency: {
        type: String,
        required: [true, "Currency is required"],
        trim: true,
        uppercase: true,
        default: "INR"
    }

}, {
    timestamps: true
});

const accountModel = mongoose.model("Account", accountSchema);
module.exports = accountModel;