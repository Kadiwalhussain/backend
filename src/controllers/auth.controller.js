const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail } = require("../services/email.service");

async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const isExists = await userModel.findOne({ email });
        if (isExists) {
            return res.status(422).json({
                success: false,
                message: "Email already exists"
            });
        }

        const user = await userModel.create({ email, password, name });

        // 🔐 Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        // 🍪 Set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        // 📧 Send welcome email (fire-and-forget — don't block the response)
        sendVerificationEmail(user.email, user.name).catch((err) => {
            console.error("❌ Welcome email failed:", err.message);
        });

        return res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
}

async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
}

module.exports = { userRegisterController, userLoginController };