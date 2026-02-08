const PurchaseSubscription = require("../models/purchaseSubscriptionModel");
const Subscription = require("../models/subscriptionModel");
const { Company } = require("../models/companyModel");
const sendPushNotification = require("../middleware/pushNotificationMiddleware");
const Notification = require("../models/notificationModel");
const userModel = require("../models/userModels");
const Transaction = require("../models/transactionModel");
const WatchEarn = require("../models/watchEarnModel");
const { generateTransactionId } = require("../utils/generateTransactionId");

function addDays(date = new Date(), days = 0) {
  const result = new Date(date); // clone date to avoid mutation
  result.setDate(result.getDate() + days);
  return result;
}

// create Purchase Subscription
const createPurchaseSubscription = async (req, res) => {
  const { planId, userId } = req.body;
  try {
    if (!planId || !userId) {
      return res.status(400).json({
        success: false,
        message: "planId and userId are required !",
      });
    }

    const plan = await Subscription.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "plan is not found !",
      });
    }

    // if any exist plan is active then we override abd upgrade that plan
    const existActivePlan = await PurchaseSubscription.findOne({
      userId,
      isActivePlan: true,
    });
    if (existActivePlan) {
      existActivePlan.isActivePlan = false;
      await existActivePlan.save();
    }

    const purchaseSubscription = await PurchaseSubscription.create({
      planId,
      userId,
      planStartTime: new Date(),
      planExpireTime: addDays(new Date(), plan.planDuration),
      planName: plan.planName,
      planDuration: plan.planDuration,
      planDescription: plan.planDescription,
      planPrice: plan.planPrice,
      planEarningFeature: plan.planEarningFeature,
      fullAccess: plan.fullAccess,
      planType: plan.planType,
    });

    const transactionMessage = `Subscribed to ${plan.planName} for ${plan.planDuration} month${plan.planDuration > 1 ? "s" : ""}.`;

    if (plan.planEarningFeature) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const periodKey = `${year}-${String(month).padStart(2, "0")}`;

      await WatchEarn.updateMany(
        { userId, isPlanActive: true },
        { $set: { isPlanActive: false } },
      );

      await WatchEarn.findOneAndUpdate(
        { userId, periodKey },
        {
          $set: {
            planPurchaseId: purchaseSubscription._id,
            planId: plan._id,
            planName: plan.planName,
            planType: plan.planType,
            planStartTime: purchaseSubscription.planStartTime,
            planExpireTime: purchaseSubscription.planExpireTime,
            isPlanActive: true,
            planDuration: plan.planDuration,
            planPrice: plan.planPrice,
            month,
            year,
            periodKey,
          },
          $setOnInsert: {
            minutesWatched: 0,
            rewardAmount: 0,
            rewardRate: 0,
            monthlyMinutesWatched: 0,
            monthlyHoursWatched: 0,
            monthlyRewardAmount: 0,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    }

    await Transaction.create({
      userId,
      amount: plan.planPrice,
      Type: "DEBIT",
      status: "APPROVED",
      transactionId: generateTransactionId(),
      message: transactionMessage,
    });

    // give referral earning if someone is referral this candidate
    // ONLY if this is their first paid subscription
    const userData = await userModel.findById(userId);

    // Count total PAID subscriptions for this user
    const paidSubscriptionCount = await PurchaseSubscription.countDocuments({
      userId,
      planPrice: { $gt: 0 },
    });

    // If this is the FIRST paid subscription (count === 1 because we just created it above)
    // AND the plan itself is paid (plan.planPrice > 0)
    if (userData.referBy && paidSubscriptionCount === 1 && plan.planPrice > 0) {
      const companyData = await Company.findOne();
      const referralUser = await userModel.findById(userData.referBy);

      if (referralUser) {
        await userModel.findByIdAndUpdate(referralUser._id, {
          $inc: {
            referralEarning: Number(companyData.referralEarning),
            wallet: Number(companyData.referralEarning),
          },
        });

        if (referralUser?.fcmToken) {
          sendPushNotification({
            notification: {
              title: "Referral Commission",
              image: "",
              body: `Congratulations! You’ve earned ₹${companyData.referralEarning} as a referral commission.`,
            },
            tokens: [referralUser.fcmToken],
          });
        }

        await Notification.create({
          title: "Referral Commission",
          message: `Congratulations! You’ve earned ₹${companyData.referralEarning} as a referral commission.`,
          userId: referralUser._id,
          userType: `${referralUser.userType}`,
          type: "referral",
          schedule: true,
        });

        // generate referral transaction
        await Transaction.create({
          userId: referralUser._id,
          amount: companyData.referralEarning,
          Type: "CREDIT",
          status: "APPROVED",
          transactionId: generateTransactionId(),
          message: "Referral Reward Added",
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Purchase Subscription Plan Successfully.",
      data: purchaseSubscription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPurchaseSubscription,
};
