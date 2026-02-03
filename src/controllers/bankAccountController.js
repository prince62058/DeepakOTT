const bankAccountDetailsModel = require("../models/bankModel");
const mongoose = require("mongoose");

// create
const createbankAccountDetails = async (req, res) => {
  try {
    const { fullName, bankName, ifscCode, type, accountNumber, upiId, userId } =
      req.body;

    if (!type && !userId) {
      return res.status(400).json({
        success: false,
        message: "type and userId are required !",
      });
    }

    // if type is bank
    if (type == "BANK") {
      if (!fullName || !bankName || !accountNumber || !ifscCode) {
        return res.status(400).json({
          success: false,
          message:
            "fullName, bankName, ifscCode and accountNumber are required !",
        });
      }
    }

    // if type is UPI
    if (type == "UPI") {
      if (!upiId) {
        return res.status(400).json({
          success: false,
          message: "upiId is required",
        });
      }
    }

    const BankAccountDetails = await bankAccountDetailsModel.create({
      fullName,
      bankName,
      accountNumber,
      ifscCode,
      type,
      upiId,
      userId,
    });

    res.status(201).json({
      success: true,
      message: "Bank account details created successfully",
      data: BankAccountDetails,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// get bank/upi by id
const getBankAccountDetailsById = async (req, res) => {
  const { bankAccountId } = req.query;
  try {
    if (!bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "bankAccountId is required !",
      });
    }

    const accountDetails = await bankAccountDetailsModel.findById(
      bankAccountId
    );
    if (!accountDetails) {
      return res.status(404).json({
        success: false,
        message: "Bank Account Not Found !",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bank account details fetched successfully",
      data: accountDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete bank/upi
const deleteBankAccountDetails = async (req, res) => {
  const { bankAccountId } = req.query;
  try {
    if (!bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "bankAccountId is required !",
      });
    }

    const deletedAccount = await bankAccountDetailsModel.findByIdAndDelete(
      bankAccountId
    );

    res.status(200).json({
      success: true,
      message: "Bank account details deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all bank/upi by userId
const getAllBankAccountDetailsOfUser = async (req, res) => {
  const { search, sort = -1, limit = 20, page = 1, userId } = req.query;
  const skip = (page - 1) * limit;
  const orFilters = [
    { bankName: new RegExp(search, "i") },
    { ifscCode: new RegExp(search, "i") },
    { accountNumber: new RegExp(search, "i") },
    { upiId: new RegExp(search, "i") },
    { fullName: new RegExp(search, "i") },
  ];

  if (mongoose.Types.ObjectId.isValid(search)) {
    orFilters.push({ userId: new mongoose.Types.ObjectId(userId) });
  }
  const filter = {
    ...(search && { $or: orFilters }),
    ...(userId && { userId }),
  };
  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }
    const accountDetails = await bankAccountDetailsModel
      .find(filter)
      .sort({ createdAt: parseInt(sort) })
      .skip(skip)
      .limit(limit);
    const total = await bankAccountDetailsModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "All Bank account details fetched successfully",
      data: accountDetails,
      currentPage: page,
      page: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update bank/upi
const updateBankAccountDetails = async (req, res) => {
  try {
    const { bankAccountId } = req.query;
    const { fullName, bankName, ifscCode, type, upiId, accountNumber } =
      req.body;

    const updatedAccount = await bankAccountDetailsModel.findByIdAndUpdate(
      bankAccountId,
      { $set: { fullName, bankName, ifscCode, type, upiId, accountNumber } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Bank account details updated successfully",
      data: updatedAccount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// for admin get all bank details
const getAlltBankAccountDetails = async (req, res) => {
  const { search, sort = -1, limit = 20, page = 1 } = req.query;
  const skip = (page - 1) * limit;
  const orFilters = [
    { bankName: new RegExp(search, "i") },
    { ifscCode: new RegExp(search, "i") },
    { accountNumber: new RegExp(search, "i") },
    { upiId: new RegExp(search, "i") },
    { fullName: new RegExp(search, "i") },
  ];

  if (mongoose.Types.ObjectId.isValid(search)) {
    orFilters.push({ userId: new mongoose.Types.ObjectId(search) });
  }
  const filter = {
    ...(search && { $or: orFilters }),
  };
  try {
    const accountDetails = await bankAccountDetailsModel
      .find(filter)
      .sort({ createdAt: parseInt(sort) })
      .skip(skip)
      .limit(limit);
    const total = await bankAccountDetailsModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "All Bank account details fetched successfully",
      data: accountDetails,
      currentPage: page,
      page: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createbankAccountDetails,
  getAllBankAccountDetailsOfUser,
  deleteBankAccountDetails,
  getBankAccountDetailsById,
};
