const mongoose = require("mongoose");
const transactionModel = require("../models/transactionModel.js");
const userModel = require("../models/userModels.js");
const WatchEarn = require("../models/watchEarnModel");
const { generateTransactionId } = require("../utils/generateTransactionId.js");

  // create transaction
  const createTransaction = async (req, res) => {
    try {
      const { userId, amount, Type, bankOrUpiId, transactionId, message } = req.body;

      if (!userId || !amount || !Type) {
        return res.status(400).json({
          success: false,
          message: "userId,amount and Type is required.",
        });
      }



      const user = await userModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }
      let transectionData;

      const transactionMessage =
        message ||
        (Type === "CREDIT"
          ? `₹${amount} credited to wallet.`
          : `₹${amount} debited from wallet.`);

      if (Type == "CREDIT") {
        transectionData = await transactionModel.create({
          userId,
          amount,
          Type,
          status: "APPROVED",
          transactionId: transactionId ? transactionId : generateTransactionId(),
          message: transactionMessage,
        });
        const balance = user?.wallet + amount;
        user.wallet = balance;
        await user.save();
      } else {
        if (!bankOrUpiId) {
          return res.status(400).json({
            success: false,
            message: "bankOrUpiId is required.",
          });
        }
        
        if (user.wallet < amount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance for withdrawal.",
          });
        }
        
        transectionData = await transactionModel.create({
          userId,
          amount,
          Type,
          bankOrUpiId,
          transactionId: "",
          message: transactionMessage,
        });
        const balance = Number(user?.wallet - amount);
        user.wallet = balance;
        await user.save();
      }

      res.status(201).json({
        success: true,
        message: "Transection created successfully",
        data: transectionData,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

const getListTransactionByUserId = async (req, res) => {
  try {
    const {
      Type,
      userId,
      page = 1,
      limit = 20,
      sort = -1,
      startDate,
      endDate,
      search,
      status,
      minAmount,
      maxAmount,
      sortBy = "createdAt",
    } = req.query;

    const skip = (page - 1) * limit;
    const sortOrder = sort === "asc" ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    // Base Filter
    const filter = {};

    if (Type) filter.Type = Type.toUpperCase();
    if (status) filter.status = status.toUpperCase();
    if (userId) filter.userId = new mongoose.Types.ObjectId(userId);

    // Amount Filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // Date Filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // 1️⃣ Fetch Data from DB (No Search Here)
    const [transactions, total] = await Promise.all([
      transactionModel
        .find(filter)
        .populate({
          path: "bankOrUpiId",
          select: "-_id -__v -createdAt -updatedAt",
        })
        .populate({
          path: "userId",
          select: "name number email",
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      transactionModel.countDocuments(filter),
    ]);

    // 2️⃣ Apply Search / Filter in Code (based on populated data)
    let finalData = transactions;

    if (search && search.trim() !== "") {
      const keyword = search.trim().toLowerCase();

      finalData = finalData.filter(tx =>
        tx.userId?.name?.toLowerCase().includes(keyword)
      );
    }

    return res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: finalData,
      pagination: {
        total: search ? finalData.length : total, // adjust total if search applied
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil((search ? finalData.length : total) / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};




// get transaction by id
const getTransactionById = async (req, res) => {
  const { transectionId } = req.query;
  try {
    if (!transectionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required !",
      });
    }
    const transectionData = await transactionModel.findById(transectionId);

    if (!transectionData) {
      return res.status(404).json({
        success: false,
        message: "transaction data not found !",
      });
    }

    res.status(200).json({
      success: true,
      message: "fetched transection data successfully",
      data: transectionData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// update transaction status by admin
const updateTransactionStatus = async (req, res) => {
  const { status, tid, message, transactionId } = req.body;
  try {
    if (!tid) {
      return res.status(400).json({
        success: false,
        message: "Tid is Required",
      });
    }
    if (status == "APPROVED" && !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction id  is Required For Status APPROVED",
      });
    }

    const data = await transactionModel.findByIdAndUpdate(
      tid,
      { status, message, transactionId },
      { new: true }
    );

    if (status == "REJECTED") {
      const user = await userModel.findById(data.userId);
      const balance = Number(data.amount);
      user.wallet += balance;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Transaction Status updated successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const filterTransaction = async (req, res) => {
  let {
    search,
    page = 1,
    limit = 20,
    sort = -1,
    startDate,
    endDate,
    Type,
    status,
    userType,
  } = req.query;
  const skip = (page - 1) * limit;

  // Build the filter object
  const filter = {
    ...(Type && { Type }),
    ...(status && { status }),
  };

  // Filter by startDate and endDate
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  try {
    // Use aggregation pipeline for efficient search with populated fields
    const pipeline = [
      // Match transactions based on filter (Type, status, date)
      { $match: filter },
      // Lookup for userId
      {
        $lookup: {
          from: "users", // Replace with your actual user collection name
          localField: "userId",
          foreignField: "_id",
          as: "userId",
        },
      },
      // Unwind userId to convert array to object
      { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
      // Lookup for listenerId
      {
        $lookup: {
          from: "users", // Replace with your actual listener collection name
          localField: "listenerId",
          foreignField: "_id",
          as: "listenerId",
        },
      },
      // Unwind listenerId to convert array to object
      { $unwind: { path: "$listenerId", preserveNullAndEmptyArrays: true } },
      // Lookup for bankId (if needed)
      {
        $lookup: {
          from: "banks", // Replace with your actual bank collection name
          localField: "bankId",
          foreignField: "_id",
          as: "bankId",
        },
      },
      // Unwind bankId to convert array to object
      { $unwind: { path: "$bankId", preserveNullAndEmptyArrays: true } },
    ];

    // Add search filter for userId.name or listenerId.name
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "userId.name": { $regex: search, $options: "i" } },
            { "listenerId.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    if (userType) {
      pipeline.push({
        $match: {
          $or: [
            { "userId.userType": userType },
            { "listenerId.userType": userType },
          ],
        },
      });
    }

    // Add sorting, skipping, and limiting
    pipeline.push(
      { $sort: { createdAt: parseInt(sort) } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    // Execute aggregation pipeline
    const [data, total] = await Promise.all([
      transactionModel.aggregate([
        {
          $match: filter,
        },
        {
          $lookup: {
            from: "bankaccounts",
            localField: "bankOrUpiId",
            foreignField: "_id",
            as: "bankDetails",
          },
        },
        {
          $unwind: {
            path: "$bankDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            amount: 1,
            Type: 1,
            status: 1,
            transactionId: 1,
            message: 1,
            createdAt: 1,
            updatedAt: 1,
            bankDetails: 1,
            userName: "$user.name",
            userNumber: "$user.number",
            userEmail: "$user.email",
          },
        },
        { $sort: { createdAt: parseInt(sort) } },
        { $skip: skip },
        { $limit: Number(limit) },
      ]),
      transactionModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Transactions fetched successfully.",
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createTransaction,
  getListTransactionByUserId,
  getTransactionById,
  updateTransactionStatus,
};
