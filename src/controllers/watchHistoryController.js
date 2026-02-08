const WatchHistory = require("../models/watchHistoryModel");
const userModel = require("../models/userModels");
const PurchaseSubscription = require("../models/purchaseSubscriptionModel");
const WatchEarn = require("../models/watchEarnModel");
const Transaction = require("../models/transactionModel");
const { Company } = require("../models/companyModel");
const { fixData } = require("../utils/urlFixer");

const DEFAULT_RATE = Number(process.env.WATCH_AND_EARN_RATE || 0.1);
const DEFAULT_TARGET = 50;

const getAllWatchHistoryByUserId = async (req, res) => {
  const { userId, page = 1, limit = 20, sort = -1 } = req.query;
  const skip = (Number(page) - 1) * limit;
  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required !",
      });
    }

    let data = await WatchHistory.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "movieOrSeriesId", // populate movie or series
        populate: [
          { path: "genre", model: "Genre" }, // populate its genre array
          { path: "language", model: "Language" }, // populate its language array
        ],
      });

    // Filter out items where movieOrSeriesId is null (e.g. if the movie was deleted)
    data = data.filter((item) => item.movieOrSeriesId);

    const total = await WatchHistory.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      message: "All Watch History Data Fetched Successfully.",
      data: fixData(data),
      currentPage: Number(page),
      page: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePlayTimeStamp = async (req, res) => {
  const { userId, movieOrSeriesId, playTimeStamps } = req.body;
  try {
    if (
      !userId ||
      !movieOrSeriesId ||
      (!playTimeStamps && playTimeStamps !== 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "userId, movieOrSeriesId and playTimeStamps are required.",
      });
    }
    const normalizedPlayTime = Number(playTimeStamps);

    if (!Number.isFinite(normalizedPlayTime) || normalizedPlayTime < 0) {
      return res.status(400).json({
        success: false,
        message: "playTimeStamps must be a non-negative number.",
      });
    }

    const normalizedId = movieOrSeriesId.includes("_nested_")
      ? movieOrSeriesId.split("_nested_")[0]
      : movieOrSeriesId;

    let watchHistory = await WatchHistory.findOne({
      userId,
      movieOrSeriesId: normalizedId,
    });

    const previousMinutes = watchHistory?.playTimeStamps || 0;
    const incrementalMinutes = Math.max(
      0,
      normalizedPlayTime - previousMinutes,
    );

    if (!watchHistory) {
      watchHistory = await WatchHistory.create({
        userId,
        movieOrSeriesId: normalizedId,
        playTimeStamps: normalizedPlayTime,
      });
      console.log(
        `✅ Created new watch history record with timestamp: ${normalizedPlayTime}`,
      );
    } else {
      const oldValue = watchHistory.playTimeStamps;
      watchHistory.playTimeStamps = normalizedPlayTime;
      await watchHistory.save();
      console.log(
        `✅ Updated watch history: ${oldValue} → ${normalizedPlayTime}`,
      );
    }

    const now = new Date();

    const activePlan = await PurchaseSubscription.findOne({
      userId,
      planType: "WATCH_AND_EARN_PLAN",
      isActivePlan: true,
      planStartTime: { $lte: now },
      planExpireTime: { $gte: now },
    });

    if (activePlan) {
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const periodKey = `${year}-${String(month).padStart(2, "0")}`;

      // Fetch dynamic settings
      const company = await Company.findOne();
      const MONTHLY_LIMIT_HOURS = company?.watchEarnTarget || DEFAULT_TARGET;
      const MONTHLY_LIMIT_MINUTES = MONTHLY_LIMIT_HOURS * 60;
      const effectiveRewardRate = company?.watchEarnRate || DEFAULT_RATE;

      // Find existing progress for this period
      const existingWatchEarn = await WatchEarn.findOne({ userId, periodKey });
      const currentMonthlyMinutes =
        existingWatchEarn?.monthlyMinutesWatched || 0;

      let billableMinutes = incrementalMinutes;
      if (currentMonthlyMinutes >= MONTHLY_LIMIT_MINUTES) {
        billableMinutes = 0;
      } else if (
        currentMonthlyMinutes + incrementalMinutes >
        MONTHLY_LIMIT_MINUTES
      ) {
        billableMinutes = MONTHLY_LIMIT_MINUTES - currentMonthlyMinutes;
      }

      const rewardAmount = Number(
        (billableMinutes * effectiveRewardRate).toFixed(2),
      );

      const updateDoc = {
        $set: {
          watchHistoryId: watchHistory._id,
          movieOrSeriesId: normalizedId,
          planPurchaseId: activePlan._id,
          planId: activePlan.planId,
          planName: activePlan.planName,
          planType: activePlan.planType,
          planStartTime: activePlan.planStartTime,
          planExpireTime: activePlan.planExpireTime,
          isPlanActive: true,
          planDuration: activePlan.planDuration,
          planPrice: activePlan.planPrice,
          rewardRate: effectiveRewardRate,
          month,
          year,
          periodKey,
        },
      };

      if (incrementalMinutes > 0) {
        updateDoc.$inc = {
          minutesWatched: incrementalMinutes,
          monthlyMinutesWatched: incrementalMinutes,
          monthlyHoursWatched: incrementalMinutes / 60,
        };

        if (rewardAmount > 0) {
          updateDoc.$inc.rewardAmount = rewardAmount;
          updateDoc.$inc.monthlyRewardAmount = rewardAmount;
        }
      }

      const watchEarnRecord = await WatchEarn.findOneAndUpdate(
        { userId, periodKey },
        updateDoc,
        { new: true, upsert: true },
      );

      if (billableMinutes > 0 && rewardAmount > 0) {
        const updatedUser = await userModel.findByIdAndUpdate(
          userId,
          { $inc: { wallet: rewardAmount } },
          { new: true, select: "wallet name" },
        );

        await Transaction.create({
          userId,
          amount: rewardAmount,
          Type: "CREDIT",
          status: "APPROVED",
          message: `Watch & Earn reward for ${billableMinutes.toFixed(1)} min at ₹${effectiveRewardRate}/min`,
        });

        watchEarnRecord.rewardAmount = Number(
          (watchEarnRecord.rewardAmount || 0).toFixed(2),
        );
        watchEarnRecord.monthlyRewardAmount = Number(
          (watchEarnRecord.monthlyRewardAmount || 0).toFixed(2),
        );
        watchEarnRecord.walletBalance = updatedUser?.wallet;
      }
    } else {
      await WatchEarn.updateMany(
        { userId, isPlanActive: true },
        { $set: { isPlanActive: false } },
      );
    }

    return res.status(200).json({
      success: true,
      message: "Update TimeStamp Successfully.",
      data: fixData(watchHistory),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const freeplanCheck = async (req, res) => {
  try {
    const { userId, playTimeStamps, movieOrSeriesId } = req.body;
    console.log("📡 freeplanCheck CALLED:", {
      userId,
      playTimeStamps,
      movieOrSeriesId,
    });

    // Save Watch History for Free Plan Users
    if (movieOrSeriesId && playTimeStamps !== undefined) {
      const normalizedId = movieOrSeriesId.includes("_nested_")
        ? movieOrSeriesId.split("_nested_")[0]
        : movieOrSeriesId;

      await WatchHistory.updateOne(
        { userId, movieOrSeriesId: normalizedId },
        {
          $set: {
            playTimeStamps: Number(playTimeStamps),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    }

    // Check user’s active FREE plan - OPTIONAL/REMOVED
    // We now rely on user.totalFreeTime for quota management,
    // regardless of whether they have a specific "FREE_PLAN" subscription doc.
    /*
    const data = await PurchaseSubscription.findOne({
      userId,
      planType: "FREE_PLAN",
      isActivePlan: true,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No active free plan found.",
      });
    }
    */

    // Fetch user free time info
    const user = await userModel
      .findById(userId)
      .select("totalFreeTime totalFreeTimeCompleted");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // If free time already completed
    if (user.totalFreeTimeCompleted) {
      return res.status(200).json({
        success: true,
        message: "You have already used your free plan.",
      });
    }

    // Calculate remaining time
    // Only deduct if deductQuota is NOT false (default to true)
    let shouldDeduct = req.body.deductQuota !== false;

    if (shouldDeduct) {
      console.log("⏳ Deducting 1 minute from Free Plan quota");
      user.totalFreeTime = user.totalFreeTime - 1;
    } else {
      console.log("💾 Saving history only (No quota deduction)");
    }

    if (user.totalFreeTime <= 0) {
      // Mark as completed when no time left
      user.totalFreeTimeCompleted = true;
      user.totalFreeTime = 0;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Your free plan time has expired.",
      });
    }

    // Update remaining free time
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Free plan updated successfully.",
      remainingFreeTime: user.totalFreeTime,
    });
  } catch (error) {
    console.error("Error in freeplanCheck:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
};

const deletePlay = async (req, res) => {
  const { userId, movieOrSeriesId } = req.body;
  try {
    const normalizedId = movieOrSeriesId.includes("_nested_")
      ? movieOrSeriesId.split("_nested_")[0]
      : movieOrSeriesId;

    const data = await WatchHistory.deleteOne({
      userId,
      movieOrSeriesId: normalizedId,
    });
    return res.status(200).json({
      success: true,
      message: "delete TimeStamp Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllWatchHistoryByUserId,
  updatePlayTimeStamp,
  freeplanCheck,
  deletePlay,
};
