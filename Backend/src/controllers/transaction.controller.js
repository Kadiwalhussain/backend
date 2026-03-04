const mongoose = require("mongoose");

const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transaction.model");
const emailService = require("../services/email.service");

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const deriveBalanceFromLedger = (entries = []) =>
  entries.reduce(
    (acc, entry) => (entry.type === "CREDIT" ? acc + entry.amount : acc - entry.amount),
    0
  );

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "fromAccount, toAccount, amount and idempotencyKey are required",
    });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than zero" });
  }

  const existingTransaction = await transactionModel.findOne({ idempotencyKey });
  if (existingTransaction) {
    return res.status(200).json({
      message: "Transaction already processed",
      transaction: existingTransaction,
    });
  }

  const [fromUserAccount, toUserAccount] = await Promise.all([
    accountModel.findById(fromAccount),
    accountModel.findById(toAccount),
  ]);

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({ message: "Invalid fromAccount or toAccount" });
  }

  if (String(fromUserAccount.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only transfer from your own account" });
  }

  if (String(fromUserAccount._id) === String(toUserAccount._id)) {
    return res.status(400).json({ message: "Self transfer is not allowed" });
  }

  if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
    return res.status(400).json({ message: "Both accounts must be ACTIVE" });
  }

  const [senderLedgerEntries, receiverLedgerEntries] = await Promise.all([
    ledgerModel.find({ account: fromAccount, status: "COMPLETED" }),
    ledgerModel.find({ account: toAccount, status: "COMPLETED" }),
  ]);

  const senderBalance = deriveBalanceFromLedger(senderLedgerEntries);
  const receiverBalance = deriveBalanceFromLedger(receiverLedgerEntries);

  if (senderBalance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance is ${senderBalance}`,
    });
  }

  let session;
  let transaction;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    transaction = (
      await transactionModel.create(
        [
          {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING",
            emailNotificationStatus: "PENDING",
          },
        ],
        { session }
      )
    )[0];

    await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount,
          balance: senderBalance - amount,
          transaction: transaction._id,
          type: "DEBIT",
          status: "COMPLETED",
          currency: fromUserAccount.currency,
        },
      ],
      { session }
    );

    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          balance: receiverBalance + amount,
          transaction: transaction._id,
          type: "CREDIT",
          status: "COMPLETED",
          currency: toUserAccount.currency,
        },
      ],
      { session }
    );

    await Promise.all([
      transactionModel.updateOne(
        { _id: transaction._id },
        { status: "COMPLETED" },
        { session }
      ),
      accountModel.updateOne({ _id: fromAccount }, { $inc: { balance: -amount } }, { session }),
      accountModel.updateOne({ _id: toAccount }, { $inc: { balance: amount } }, { session }),
    ]);

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    return res.status(500).json({
      message: "Transaction failed. Please retry.",
      error: error.message,
    });
  }

  try {
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);
    await transactionModel.updateOne(
      { _id: transaction._id },
      { emailNotificationStatus: "SENT" }
    );
  } catch (error) {
    await transactionModel.updateOne(
      { _id: transaction._id },
      { emailNotificationStatus: "FAILED" }
    );
  }

  const finalTransaction = await transactionModel.findById(transaction._id);

  return res.status(201).json({
    message: "Transaction completed successfully",
    transaction: finalTransaction,
  });
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount, amount and idempotencyKey are required",
    });
  }

  const toUserAccount = await accountModel.findById(toAccount);
  if (!toUserAccount) {
    return res.status(400).json({ message: "Invalid toAccount" });
  }

  const fromUserAccount = await accountModel.findOne({ user: req.user._id });
  if (!fromUserAccount) {
    return res.status(400).json({ message: "System account not found" });
  }

  const [senderLedgerEntries, receiverLedgerEntries] = await Promise.all([
    ledgerModel.find({ account: fromUserAccount._id, status: "COMPLETED" }),
    ledgerModel.find({ account: toAccount, status: "COMPLETED" }),
  ]);

  const senderBalance = deriveBalanceFromLedger(senderLedgerEntries);
  const receiverBalance = deriveBalanceFromLedger(receiverLedgerEntries);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = new transactionModel({
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
      emailNotificationStatus: "UNKNOWN",
    });

    await ledgerModel.create(
      [
        {
          account: fromUserAccount._id,
          amount,
          balance: senderBalance - amount,
          transaction: transaction._id,
          type: "DEBIT",
          status: "COMPLETED",
          currency: fromUserAccount.currency,
        },
      ],
      { session }
    );

    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          balance: receiverBalance + amount,
          transaction: transaction._id,
          type: "CREDIT",
          status: "COMPLETED",
          currency: toUserAccount.currency,
        },
      ],
      { session }
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await Promise.all([
      accountModel.updateOne(
        { _id: fromUserAccount._id },
        { $inc: { balance: -amount } },
        { session }
      ),
      accountModel.updateOne({ _id: toAccount }, { $inc: { balance: amount } }, { session }),
    ]);

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Initial funds transaction completed successfully",
      transaction,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: "Initial funds transaction failed",
      error: error.message,
    });
  }
}

async function getTransactionHistory(req, res) {
  try {
    const account = await accountModel.findOne({ user: req.user._id });

    if (!account) {
      return res.status(404).json({ success: false, message: "No account found" });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const status = req.query.status || "";
    const type = req.query.type || "";
    const search = String(req.query.search || "").trim();
    const sort = req.query.sort === "oldest" ? 1 : -1;
    const minAmount = req.query.minAmount ? Number(req.query.minAmount) : null;
    const maxAmount = req.query.maxAmount ? Number(req.query.maxAmount) : null;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : null;

    const accountId = toObjectId(account._id);

    const baseMatch = {
      $or: [{ fromAccount: accountId }, { toAccount: accountId }],
    };

    if (status) {
      baseMatch.status = status;
    }

    if (minAmount !== null || maxAmount !== null) {
      baseMatch.amount = {};
      if (minAmount !== null && !Number.isNaN(minAmount)) baseMatch.amount.$gte = minAmount;
      if (maxAmount !== null && !Number.isNaN(maxAmount)) baseMatch.amount.$lte = maxAmount;
    }

    if (fromDate || toDate) {
      baseMatch.createdAt = {};
      if (fromDate && !Number.isNaN(fromDate.getTime())) baseMatch.createdAt.$gte = fromDate;
      if (toDate && !Number.isNaN(toDate.getTime())) baseMatch.createdAt.$lte = toDate;
    }

    const searchStage = [];
    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        searchStage.push({ _id: toObjectId(search) });
      }

      searchStage.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: search,
            options: "i",
          },
        },
      });
    }

    const typeMatch = [];
    if (type === "SENT") {
      typeMatch.push({ fromAccount: accountId, idempotencyKey: { $not: /^WELCOME_BONUS_/ } });
    } else if (type === "RECEIVED") {
      typeMatch.push({ toAccount: accountId, idempotencyKey: { $not: /^WELCOME_BONUS_/ } });
    } else if (type === "SYSTEM_CREDIT") {
      typeMatch.push({ toAccount: accountId, idempotencyKey: /^WELCOME_BONUS_/ });
    }

    const matchStage = {
      ...baseMatch,
      ...(searchStage.length ? { $and: [{ $or: searchStage }] } : {}),
      ...(typeMatch.length ? { $and: [...(searchStage.length ? [{ $or: searchStage }] : []), { $or: typeMatch }] } : {}),
    };

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "accounts",
          localField: "fromAccount",
          foreignField: "_id",
          as: "fromAccountDoc",
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "toAccount",
          foreignField: "_id",
          as: "toAccountDoc",
        },
      },
      { $unwind: { path: "$fromAccountDoc", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$toAccountDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "fromAccountDoc.user",
          foreignField: "_id",
          as: "fromUserDoc",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "toAccountDoc.user",
          foreignField: "_id",
          as: "toUserDoc",
        },
      },
      { $unwind: { path: "$fromUserDoc", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$toUserDoc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          directionType: {
            $cond: [{ $eq: ["$fromAccount", accountId] }, "SENT", "RECEIVED"],
          },
          displayType: {
            $cond: [
              { $regexMatch: { input: "$idempotencyKey", regex: "^WELCOME_BONUS_" } },
              "SYSTEM_CREDIT",
              {
                $cond: [{ $eq: ["$fromAccount", accountId] }, "SENT", "RECEIVED"],
              },
            ],
          },
        },
      },
      { $sort: { createdAt: sort } },
      {
        $project: {
          _id: 1,
          amount: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          idempotencyKey: 1,
          currency: 1,
          emailNotificationStatus: 1,
          fromAccount: 1,
          toAccount: 1,
          fromAccountNumber: "$fromAccountDoc.accountNumber",
          toAccountNumber: "$toAccountDoc.accountNumber",
          fromUserName: "$fromUserDoc.name",
          toUserName: "$toUserDoc.name",
          displayType: 1,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          meta: [{ $count: "total" }],
        },
      },
    ];

    const [result] = await transactionModel.aggregate(pipeline);
    const transactions = result?.data || [];
    const total = result?.meta?.[0]?.total || 0;

    return res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasMore: skip + transactions.length < total,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
}

async function getRecentTransactions(req, res) {
  try {
    const account = await accountModel.findOne({ user: req.user._id });

    if (!account) {
      return res.status(404).json({ success: false, message: "No account found" });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);

    const transactions = await transactionModel
      .find({ $or: [{ fromAccount: account._id }, { toAccount: account._id }] })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
}

async function getTransactionDetail(req, res) {
  try {
    const transactionId = req.params.transactionId;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, message: "Invalid transactionId" });
    }

    const account = await accountModel.findOne({ user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: "No account found" });
    }

    const transaction = await transactionModel.findOne({
      _id: transactionId,
      $or: [{ fromAccount: account._id }, { toAccount: account._id }],
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const [fromAccountDoc, toAccountDoc, ledgerEntries] = await Promise.all([
      accountModel.findById(transaction.fromAccount).populate({ path: "user", select: "name email" }),
      accountModel.findById(transaction.toAccount).populate({ path: "user", select: "name email" }),
      ledgerModel
        .find({ transaction: transaction._id })
        .populate({
          path: "account",
          select: "accountNumber user",
          populate: { path: "user", select: "name email" },
        })
        .sort({ createdAt: 1 }),
    ]);

    const debitEntry = ledgerEntries.find((entry) => entry.type === "DEBIT") || null;
    const creditEntry = ledgerEntries.find((entry) => entry.type === "CREDIT") || null;

    const lifecycle = {
      pendingAt: transaction.createdAt,
      completedAt: transaction.status === "COMPLETED" ? transaction.updatedAt : null,
      failedAt: transaction.status === "FAILED" ? transaction.updatedAt : null,
      reversedAt: transaction.status === "REVERSED" ? transaction.updatedAt : null,
    };

    return res.status(200).json({
      success: true,
      transaction: {
        _id: transaction._id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        idempotencyKey: transaction.idempotencyKey,
        emailNotificationStatus: transaction.emailNotificationStatus || "UNKNOWN",
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        fromAccount: {
          _id: fromAccountDoc?._id,
          accountNumber: fromAccountDoc?.accountNumber,
          owner: fromAccountDoc?.user
            ? {
                name: fromAccountDoc.user.name,
                email: fromAccountDoc.user.email,
              }
            : null,
        },
        toAccount: {
          _id: toAccountDoc?._id,
          accountNumber: toAccountDoc?.accountNumber,
          owner: toAccountDoc?.user
            ? {
                name: toAccountDoc.user.name,
                email: toAccountDoc.user.email,
              }
            : null,
        },
        lifecycle,
      },
      ledger: {
        debitEntry: debitEntry
          ? {
              _id: debitEntry._id,
              accountNumber: debitEntry.account?.accountNumber,
              accountOwner: debitEntry.account?.user?.name || null,
              amount: debitEntry.amount,
              balanceSnapshot: debitEntry.balance,
              currency: debitEntry.currency,
              status: debitEntry.status,
              createdAt: debitEntry.createdAt,
            }
          : null,
        creditEntry: creditEntry
          ? {
              _id: creditEntry._id,
              accountNumber: creditEntry.account?.accountNumber,
              accountOwner: creditEntry.account?.user?.name || null,
              amount: creditEntry.amount,
              balanceSnapshot: creditEntry.balance,
              currency: creditEntry.currency,
              status: creditEntry.status,
              createdAt: creditEntry.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
}

module.exports = {
  createTransaction,
  createInitialFundsTransaction,
  getTransactionHistory,
  getRecentTransactions,
  getTransactionDetail,
};
