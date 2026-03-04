const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required for registration"],
        trim: true,
        lowercase: true,
        match: [/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, "Please enter a valid email address"],
        unique: true
    },
    name: {
        type: String,
        required: [true, "Name is required for registration"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [50, "Name cannot exceed 50 characters"]
    },
    password: {
        type: String,
        required: [true, "Password is required for registration"],
        minlength: [6, "Password must be at least 6 characters long"],
        maxlength: [128, "Password cannot exceed 128 characters"],
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otpHash: {
        type: String,
        default: null,
        select: false
    },
    otpExpiresAt: {
        type: Date,
        default: null,
        select: false
    },
    otpAttempts: {
        type: Number,
        default: 0,
        select: false
    },
    otpLockUntil: {
        type: Date,
        default: null,
        select: false
    }
}, {
    timestamps: true
});


// 🔐 Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});


// 🔑 Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;