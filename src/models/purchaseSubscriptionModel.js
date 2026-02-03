const mongoose = require("mongoose");

const purchaseSubscriptionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    planStartTime: {
      type: Date,
    },
    planExpireTime: {
      type: Date,
    },
    isActivePlan: {
      type: Boolean,
      default: true,
    },
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
    planType:{
      type:String,
      trim:true
    }
  },
  { timestamps: true }
);

const PurchaseSubscription = mongoose.model(
  "PurchaseSubscription",
  purchaseSubscriptionSchema
);
module.exports = PurchaseSubscription;
