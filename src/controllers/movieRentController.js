const MovieRent = require("../models/movieRentModel");
const PurchaseSubscription = require("../models/purchaseSubscriptionModel");
const { fixData } = require("../utils/urlFixer");

// create movie rent api
const createMovieRent = async (req, res) => {
  const { userId, movieId } = req.body;
  try {
    if (!userId || !movieId) {
      return res.status(400).json({
        success: false,
        message: "userId and movieId are required !",
      });
    }

    const havePlan = await PurchaseSubscription.findOne({
      userId,
      isActivePlan: true,
      planType: "PAY_PER_MOVIE_PLAN",
    });
    if (!havePlan) {
      return res.status(404).json({
        success: false,
        message: "You don't have PAY_PER_MOVIE_PLAN",
      });
    }

    const normalizedId = movieId.includes("_nested_")
      ? movieId.split("_nested_")[0]
      : movieId;

    const data = await MovieRent.create({
      userId,
      movieId: normalizedId,
      planId: havePlan.planId,
      planStartTime: havePlan.planStartTime,
      planExpireTime: havePlan.planExpireTime,
    });

    // after purchase movie we will disable this plan
    havePlan.isActivePlan = false;
    await havePlan.save();

    return res.status(201).json({
      success: true,
      message: "You have successfully purchased",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all rented movie list with filter
const getAllMovieRentByUserId = async (req, res) => {
  const { page = 1, sort = -1, limit = 20, isActivePlan } = req.query;
  const skip = (Number(page) - 1) * limit;
  const filter = {
    ...(isActivePlan && { isActivePlan: isActivePlan == true ? true : false }),
  };
  try {
    const data = await MovieRent.find(filter)
      .sort({ createdAt: parseInt(sort) })
      .skip(skip)
      .limit(limit);
    const total = await MovieRent.countDocuments();

    return res.status(200).json({
      success: true,
      message: "All Rented Movie Data Fetched Successfully.",
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

module.exports = {
  createMovieRent,
  getAllMovieRentByUserId,
};
