const Subscription = require("../models/subscriptionModel");

// create Subscription
const createSubscription = async (req, res) => {
  const {
    planName,
    planDuration,
    planDescription,
    planPrice,
    planEarningFeature,
    fullAccess,
    planType,
  } = req.body;
  try {
    if (
      !planName ||
      !planDuration ||
      !planDescription ||
      !planPrice ||
      !planType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All these fields planName, planDuration, planDescription, planType and planPrice are required !",
      });
    }

    const data = await Subscription.create({
      planName,
      planDuration,
      planDescription,
      planPrice,
      planEarningFeature,
      fullAccess,
      planType,
    });

    return res.status(201).json({
      success: true,
      message: "Subscription Plan Created Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update subscription
const updateSubscription = async (req, res) => {
  const {
    planId,
    planName,
    planDuration,
    planDescription,
    planPrice,
    planEarningFeature,
    fullAccess,
    planType,
  } = req.body;
  try {
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required !",
      });
    }

    const data = await Subscription.findByIdAndUpdate(
      planId,
      {
        planName,
        planDuration,
        planDescription,
        planPrice,
        planEarningFeature,
        fullAccess,
        planType,
      },

      { new: true },
    );

    return res.status(201).json({
      success: true,
      message: "Subscription Plan Updated Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all subscription plan
const getAllSubscription = async (req, res) => {
  const { page = "1", limit = "20", search, disable } = req.query;

  try {
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {};

    if (disable) {
      filter.disable = disable;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { planName: regex },
        { planDescription: regex },
        { planType: regex },
      ];
    }

    const [data, total] = await Promise.all([
      Subscription.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Subscription.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / parsedLimit) || 1;

    return res.status(200).json({
      success: true,
      message: "All Subscription Plan Data Fetched Successfully.",
      data,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// disable subscription
const disableSubscription = async (req, res) => {
  const { planId, disable } = req.body;
  try {
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required !",
      });
    }
    const data = await Subscription.findById(planId);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Invalid Credential !",
      });
    }

    data.disable = disable == true ? true : false;
    await data.save();

    return res.status(200).json({
      success: true,
      message:
        disable == true
          ? "Subscription plan disabled successfully."
          : "Subscription plan enabled successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// upload poster
const imageToUrl = async (req, res) => {
  const image = req.file
    ? `https://satyakabir-bucket.sgp1.digitaloceanspaces.com/${req.file.key}`
    : "";
  try {
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "image is required.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image url generated successfully.",
      URL: image,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete subscription
const deleteSubscription = async (req, res) => {
  const { planId } = req.body;
  try {
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required !",
      });
    }

    const data = await Subscription.findById(planId);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found!",
      });
    }

    await Subscription.findByIdAndDelete(planId);

    return res.status(200).json({
      success: true,
      message: "Subscription plan deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSubscription,
  updateSubscription,
  getAllSubscription,
  disableSubscription,
  deleteSubscription,
  imageToUrl,
};
