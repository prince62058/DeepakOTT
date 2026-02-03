const mongoose = require("mongoose");
const userModel = require("../models/userModels");
const PurchaseSubscription = require("../models/purchaseSubscriptionModel");
const Transaction = require("../models/transactionModel");
const WatchHistory = require("../models/watchHistoryModel");
const WatchEarn = require("../models/watchEarnModel");

const buildDateRangeFilter = (startDate, endDate, field = "createdAt") => {
  if (!startDate && !endDate) {
    return {};
  }

  const filter = {};

  if (startDate) {
    filter.$gte = new Date(startDate);
  }

  if (endDate) {
    filter.$lte = new Date(endDate);
  }

  if (filter.$gte || filter.$lte) {
    return { [field]: filter };
  }

  return {};
};

const parseBooleanQuery = (value) =>
  value === true || value === "true" || value === "1" || value === 1;

const getDashboardSummary = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userType,
      includeDaily = true,
      includeRevenueTrend = true,
      includeUserGrowth = true,
    } = req.query;

    const includeDailyFlag = parseBooleanQuery(includeDaily);
    const includeRevenueTrendFlag = parseBooleanQuery(includeRevenueTrend);
    const includeUserGrowthFlag = parseBooleanQuery(includeUserGrowth);

    const dateFilter = buildDateRangeFilter(startDate, endDate);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalSubAdmins,
      activePlans,
      subscriptionTypeAgg,
      revenueAgg,
      transactionsAgg,
      watchEarnAgg,
    ] = await Promise.all([
      userModel.countDocuments(userType ? { userType } : {}),
      userModel.countDocuments({ disable: false, ...(userType ? { userType } : {}) }),
      userModel.countDocuments({ ...dateFilter }),
      userModel.countDocuments({ userType: "SubAdmin" }),
      PurchaseSubscription.countDocuments({ isActivePlan: true, ...dateFilter }),
      PurchaseSubscription.aggregate([
        { $match: { ...dateFilter } },
        {
          $group: {
            _id: "$planType",
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: { ...dateFilter } },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ["$Type", "CREDIT"] },
                  "$amount",
                  0,
                ],
              },
            },
            totalPayout: {
              $sum: {
                $cond: [
                  { $eq: ["$Type", "DEBIT"] },
                  "$amount",
                  0,
                ],
              },
            },
            totalTransactions: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: { ...dateFilter } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      WatchEarn.aggregate([
        { $match: { ...dateFilter } },
        {
          $group: {
            _id: null,
            totalMinutesWatched: { $sum: "$monthlyMinutesWatched" },
            totalHoursWatched: { $sum: "$monthlyHoursWatched" },
            totalRewardsPaid: { $sum: "$monthlyRewardAmount" },
          },
        },
      ]),
    ]);

    const dailyTrend = includeDailyFlag
      ? await WatchHistory.aggregate([
          { $match: { ...dateFilter } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              totalWatchMinutes: { $sum: "$playTimeStamps" },
              totalViews: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
      : [];

    const revenueTrend = includeRevenueTrendFlag
      ? await Transaction.aggregate([
          { $match: { ...dateFilter } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              totalCredit: {
                $sum: {
                  $cond: [{ $eq: ["$Type", "CREDIT"] }, "$amount", 0],
                },
              },
              totalDebit: {
                $sum: {
                  $cond: [{ $eq: ["$Type", "DEBIT"] }, "$amount", 0],
                },
              },
              transactionCount: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
      : [];

    const userGrowthTrend = includeUserGrowthFlag
      ? await userModel.aggregate([
          {
            $match: {
              ...dateFilter,
              ...(userType ? { userType } : {}),
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              newUsers: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
      : [];

    const revenueStats = revenueAgg?.[0] || {
      totalRevenue: 0,
      totalPayout: 0,
      totalTransactions: 0,
    };

    const subscriptionTypeBreakdown = subscriptionTypeAgg.reduce((acc, item) => {
      const key = item._id || "UNKNOWN";
      acc[key] = item.count;
      return acc;
    }, {});

    const transactionStatusBreakdown = transactionsAgg.reduce((acc, item) => {
      acc[item._id || "UNKNOWN"] = item.count;
      return acc;
    }, {});

    const watchEarnStats = watchEarnAgg?.[0] || {
      totalMinutesWatched: 0,
      totalHoursWatched: 0,
      totalRewardsPaid: 0,
    };

    return res.status(200).json({
      success: true,
      message: "Dashboard metrics fetched successfully.",
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newUsers,
          totalSubAdmins,
        },
        subscriptions: {
          activePlans,
          byType: subscriptionTypeBreakdown,
        },
        revenue: revenueStats,
        transactions: {
          statusBreakdown: transactionStatusBreakdown,
        },
        watchAndEarn: watchEarnStats,
        trends: {
          daily: dailyTrend,
          revenue: revenueTrend,
          userGrowth: userGrowthTrend,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardSummary,
};
