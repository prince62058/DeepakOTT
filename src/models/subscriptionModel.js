const mongoose = require("mongoose");

const subscriptionSchema = mongoose.Schema(
  {
    planName: {
      type: String,
    },
    planDuration: {
      type: Number,
      default: 0,
    },
    planDescription: {
      type: String,
    },
    planPrice: {
      type: Number,
      default: 0,
    },
    planEarningFeature: {
      type: Boolean,
      default: false,
    },
    fullAccess: {
      type: Boolean,
      default: false,
    },
    freeWatchTimeLimit: {
      type: Number,
      default: 10, // Time limit in minutes for free plan users
      comment: "Watch time limit in minutes for free users (0 = unlimited)",
    },
    planType: {
      type: String,
      enum: [
        "FREE_PLAN",
        "YEARLY_PREMIUM_PLAN",
        "WATCH_AND_EARN_PLAN",
        "MONTHLY_PREMIUM",
        "PAY_PER_MOVIE_PLAN",
      ],
    },
    disable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = Subscription;
