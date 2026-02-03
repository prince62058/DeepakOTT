const userModel = require("../models/userModels");
const { Company } = require("../models/companyModel");
const sendPushNotification = require("../middleware/pushNotificationMiddleware");
const Notification = require("../models/notificationModel")

const referralEarning = async (req, res, next) => {
  const referralCode  = req.query?.referralCode || req.body?.referralCode;
  try {
    if (!referralCode) {
      return next();
    }
    const userData = await userModel.findOne({ referralCode });
    // const companyData = await Company.findOne();
    if (!userData) {
      return res.status(400).json({
        success: false,
        message: "Invalid Referral Code !",
      });
    }


     req.referral = { userId: userData._id, user: userData };
    // req.userDataId = userData._id;

    // userData.referralEarning += companyData.referralEarning;
    // userData.wallet += companyData.referralEarning;
    // await userData.save();
   

            // send notification
          // const notificationPayload = {
          //     notification: { title:"Referral Commission",image:"", body: `Congratulations! You’ve earned ₹${companyData.referralEarning} as a referral commission.` },
          //     tokens: [userData.fcmToken],
          //   };
        
          //   sendPushNotification(notificationPayload);
          //   await Notification.create({
          //     title: "Referral Commission",
          //     message: `Congratulations! You’ve earned ₹${companyData.referralEarning} as a referral commission.`,
          //     userId:userData._id,
          //     userType: `${userData.userType}`,
          //     schedule: true,
          //   });


    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {referralEarning}
