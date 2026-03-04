const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transaction.model");
const userModel = require("../models/user.model");
const { sendOtpEmail, sendVerificationEmail } = require("../services/email.service");

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCK_MINUTES = 15;
const WELCOME_BONUS_AMOUNT = 1000;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function buildToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "3d" });
}

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });
}

async function ensureSystemAccount(session) {
  const systemEmail = process.env.SYSTEM_EMAIL || "system@backend-ledger.local";

  let systemUser = await userModel.findOne({ email: systemEmail }).session(session);

  if (!systemUser) {
    systemUser = await userModel.create(
      [
        {
          email: systemEmail,
          name: "System",
          password: `System#${Date.now()}Aa1!`,
          isVerified: true,
        },
      ],
      { session }
    ).then((docs) => docs[0]);
  }

  let systemAccount = await accountModel.findOne({ user: systemUser._id }).session(session);

  if (!systemAccount) {
    systemAccount = await accountModel.create(
      [
        {
          user: systemUser._id,
          currency: "INR",
          balance: 10000000,
        },
      ],
      { session }
    ).then((docs) => docs[0]);
  }

  return systemAccount;
}

async function applyWelcomeBonus({ user, targetAccount, session }) {
  const idempotencyKey = `WELCOME_BONUS_${user._id}`;
  const existingTransaction = await transactionModel
    .findOne({ idempotencyKey })
    .session(session);

  if (existingTransaction) {
    return { transaction: existingTransaction, credited: false };
  }

  const systemAccount = await ensureSystemAccount(session);

  const transaction = await transactionModel.create(
    [
      {
        fromAccount: systemAccount._id,
        toAccount: targetAccount._id,
        amount: WELCOME_BONUS_AMOUNT,
        idempotencyKey,
        status: "COMPLETED",
        currency: "INR",
      },
    ],
    { session }
  ).then((docs) => docs[0]);

  await ledgerModel.create(
    [
      {
        account: systemAccount._id,
        transaction: transaction._id,
        amount: WELCOME_BONUS_AMOUNT,
        type: "DEBIT",
        status: "COMPLETED",
        currency: "INR",
      },
      {
        account: targetAccount._id,
        transaction: transaction._id,
        amount: WELCOME_BONUS_AMOUNT,
        type: "CREDIT",
        status: "COMPLETED",
        currency: "INR",
      },
    ],
    { session }
  );

  await accountModel.updateOne(
    { _id: targetAccount._id },
    { $inc: { balance: WELCOME_BONUS_AMOUNT } },
    { session }
  );

  await accountModel.updateOne(
    { _id: systemAccount._id },
    { $inc: { balance: -WELCOME_BONUS_AMOUNT } },
    { session }
  );

  return { transaction, credited: true };
}

async function userRegisterController(req, res) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const isExists = await userModel.findOne({ email });
    if (isExists) {
      return res.status(422).json({
        success: false,
        message: "Email already exists",
      });
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const user = await userModel.create({
      email,
      password,
      name,
      isVerified: false,
      otpHash: hashOtp(otpCode),
      otpExpiresAt,
      otpAttempts: 0,
      otpLockUntil: null,
    });

    sendOtpEmail(user.email, user.name, otpCode).catch((err) => {
      console.error("OTP email failed:", err.message);
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to email.",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
}

async function resendOtpController(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await userModel.findOne({ email }).select(
      "+otpHash +otpExpiresAt +otpAttempts +otpLockUntil"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(409).json({
        success: false,
        message: "User already verified",
      });
    }

    const otpCode = generateOtp();
    user.otpHash = hashOtp(otpCode);
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLockUntil = null;
    await user.save();

    sendOtpEmail(user.email, user.name, otpCode).catch((err) => {
      console.error("OTP resend email failed:", err.message);
    });

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
}

async function verifyOtpController(req, res) {
  const session = await mongoose.startSession();

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    session.startTransaction();

    const user = await userModel
      .findOne({ email })
      .select("+otpHash +otpExpiresAt +otpAttempts +otpLockUntil")
      .session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      const token = buildToken(user._id);
      await session.commitTransaction();
      setAuthCookie(res, token);
      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        message: "Account already verified",
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
        },
      });
    }

    if (user.otpLockUntil && user.otpLockUntil > new Date()) {
      await session.abortTransaction();
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please try again later.",
        lockUntil: user.otpLockUntil,
      });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    const isOtpValid = user.otpHash === hashOtp(String(otp));

    if (!isOtpValid) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
        user.otpLockUntil = new Date(Date.now() + OTP_LOCK_MINUTES * 60 * 1000);
      }

      await user.save({ session });
      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message:
          user.otpAttempts >= OTP_MAX_ATTEMPTS
            ? "Maximum attempts exceeded. OTP verification locked temporarily."
            : "Invalid OTP",
        attemptsLeft: Math.max(OTP_MAX_ATTEMPTS - user.otpAttempts, 0),
      });
    }

    user.isVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    user.otpLockUntil = null;
    await user.save({ session });

    let account = await accountModel.findOne({ user: user._id }).session(session);
    if (!account) {
      account = await accountModel.create(
        [
          {
            user: user._id,
            currency: "INR",
          },
        ],
        { session }
      ).then((docs) => docs[0]);
    }

    let bonus = null;

    try {
      bonus = await applyWelcomeBonus({ user, targetAccount: account, session });
    } catch (error) {
      console.error("Welcome bonus credit failed:", error.message);
      bonus = {
        transaction: null,
        credited: false,
        error: "Welcome bonus is delayed. Please contact support if not credited soon.",
      };
    }

    await sendVerificationEmail(user.email, user.name);

    await session.commitTransaction();

    const token = buildToken(user._id);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
      bonus: {
        amount: WELCOME_BONUS_AMOUNT,
        credited: Boolean(bonus?.credited),
        transactionId: bonus?.transaction?._id || null,
        error: bonus?.error || null,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  } finally {
    session.endSession();
  }
}

async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_NOT_VERIFIED",
        message: "Please verify OTP before logging in.",
      });
    }

    const token = buildToken(user._id);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
}

async function getMeController(req, res) {
  try {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        isVerified: req.user.isVerified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
}

async function logoutController(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
}

module.exports = {
  userRegisterController,
  resendOtpController,
  verifyOtpController,
  userLoginController,
  getMeController,
  logoutController,
};
