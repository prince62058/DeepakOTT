const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userModel = require("./src/models/userModels");
const PurchaseSubscription = require("./src/models/purchaseSubscriptionModel");

dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");

    const user = await userModel.findOne({ number: 7909096076 });

    if (!user) {
      console.log("User not found!");
      process.exit(1);
    }

    console.log("User Found:", user.name, user._id);
    console.log("Total Free Time:", user.totalFreeTime);
    console.log("Total Free Time Completed:", user.totalFreeTimeCompleted);

    const activePlan = await PurchaseSubscription.findOne({
      userId: user._id,
      isActivePlan: true,
    }).sort({ createdAt: -1 });

    console.log(
      "Active Plan:",
      activePlan ? activePlan.planType : "No Active Plan",
    );
    console.log("Plan Details:", activePlan);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
};

checkUser();
