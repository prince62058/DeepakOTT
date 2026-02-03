const mongoose = require("mongoose");

const bankAccountDetailsSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    bankName: {
      type: String,
    },
    ifscCode: {
      type: String,
    },
    type: {
      type: String,
      enum: ["BANK", "UPI"],
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    upiId: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

const BankAccount = mongoose.model(
  "BankAccount",
  bankAccountDetailsSchema
);

module.exports = BankAccount;
