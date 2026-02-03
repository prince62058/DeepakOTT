const mongoose = require("mongoose");

const watchEarnSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    movieOrSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MovieWebSeries",
    },
    watchHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WatchHistory",
    },
    planPurchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseSubscription",
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    planName: {
      type: String,
      trim: true,
    },
    planType: {
      type: String,
      trim: true,
    },
    planStartTime: {
      type: Date,
    },
    planExpireTime: {
      type: Date,
    },
    isPlanActive: {
      type: Boolean,
      default: false,
    },
    planDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
    planPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    minutesWatched: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
      default: () => new Date().getMonth() + 1,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    periodKey: {
      type: String,
      default: () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      },
      index: true,
    },
    monthlyMinutesWatched: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyHoursWatched: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyRewardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const WatchEarn = mongoose.model("WatchEarn", watchEarnSchema);

module.exports = WatchEarn;
