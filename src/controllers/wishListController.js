const WishList = require("../models/wishListModel");
const MovieWebSeries = require("../models/movieWebSeriesModel");

// create wish list
const createWishList = async (req, res) => {
  const { userId, movieOrSeriesId } = req.body;
  try {
    if (!userId || !movieOrSeriesId) {
      return res.status(400).json({
        success: false,
        message: "userId and movieOrSeriesId are required !",
      });
    }
    const fileData = await MovieWebSeries.findById(movieOrSeriesId);

    const existWishList = await WishList.findOne({
      userId,
      movieOrSeriesId,
    });

    let data =existWishList;
    if(!existWishList){
     data = await WishList.create({
      userId,
      movieOrSeriesId,
      mainType: fileData.mainType,
    });
    }

    return res.status(201).json({
      success: true,
      message: "Create Wish List Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all by userId
const getAllWishListByUserId = async (req, res) => {
  const { userId, mainType, page = 1, limit = 20, sort = -1 } = req.query;
  const skip = (Number(page) - 1) * limit;
  const filter = {
    ...(mainType && { mainType }),
  };
  filter.userId = userId;
  try {
    const data = await WishList.find(filter)
      .sort({ createdAt: parseInt(sort) })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "movieOrSeriesId", // populate movie or series
        populate: [
          { path: "genre", model: "Genre" }, // populate its genre array
          { path: "language", model: "Language" }, // populate its language array
        ],
      });
    const total = await WishList.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "All Wish List Data Fetched Successfully.",
      data: data,
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

// delete wishList by Id
const deleteWishListById = async (req, res) => {
  const { userId, movieOrSeriesId } = req.query;

  try {
    if (!userId || !movieOrSeriesId) {
      return res.status(400).json({
        success: false,
        message: "userId and movieOrSeriesId are required !",
      });
    }

    const data = await WishList.findOneAndDelete({
      userId,
      movieOrSeriesId,
    });

    return res.status(200).json({
      success: true,
      message: "Successfully Remove from wishList",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createWishList,
  getAllWishListByUserId,
  deleteWishListById,
};
