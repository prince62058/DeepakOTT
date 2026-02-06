const movieOrWebSeries = require("../models/movieWebSeriesModel");
const userModel = require("../models/userModels");
const watchHistory = require("../models/watchHistoryModel");
const Genre = require("../models/genrePreferenceModel.js");
const { fixData } = require("../utils/urlFixer");

// home page api
const homePage = async (req, res) => {
  const { userId } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required!",
      });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let recommandedQuery = {};
    if (userData.genrePreferences && userData.genrePreferences.length > 0) {
      recommandedQuery = { genre: { $in: userData.genrePreferences } };
    }

    const [watchHistoryData, trendingData, recommandedData, trendingOne] =
      await Promise.all([
        watchHistory
          .find({ userId })
          .limit(4)
          .populate({
            path: "movieOrSeriesId",
            populate: [
              { path: "genre", model: "Genre" },
              { path: "language", model: "Language" },
            ],
          }),
        movieOrWebSeries
          .find({ imdbRating: { $gte: 7 } })
          .limit(4)
          .populate("language genre"),
        movieOrWebSeries
          .find(recommandedQuery)
          .limit(4)
          .populate("language genre"),
        movieOrWebSeries
          .find()
          .populate("language genre")
          .sort({ createdAt: -1 })
          .limit(4),
      ]);

    return res.status(200).json({
      success: true,
      message: "Home Data Fetched Successfully.",
      data: {
        userData,
        watchHistoryData: fixData(watchHistoryData),
        trendingData: fixData(trendingData),
        recommandedData: fixData(recommandedData),
        trendingOne: fixData(trendingOne),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// trending page api
const trending = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    const filter = { imdbRating: { $gte: 7 } };
    const [trendingData, total] = await Promise.all([
      movieOrWebSeries
        .find(filter)
        .skip(skip)
        .limit(limitNum)
        .populate("language genre"),
      movieOrWebSeries.countDocuments(filter),
    ]);
    return res.status(200).json({
      success: true,
      message: "All Trending Data Fetched Successfully.",
      data: trendingData,
      currentPage: pageNum,
      page: Math.ceil(total / limitNum),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// recommendation page api
const recommanded = async (req, res) => {
  const { userId, page = 1, limit = 20 } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required!",
      });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    let recommandedQuery = {};
    if (userData.genrePreferences && userData.genrePreferences.length > 0) {
      recommandedQuery = { genre: { $in: userData.genrePreferences } };
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [recommandedData, total] = await Promise.all([
      movieOrWebSeries
        .find(recommandedQuery)
        .skip(skip)
        .limit(limitNum)
        .populate("language genre"),
      movieOrWebSeries.countDocuments(recommandedQuery),
    ]);

    return res.status(200).json({
      success: true,
      message: "All Recommanded Data Fetched Successfully.",
      data: recommandedData,
      currentPage: pageNum,
      page: Math.ceil(total / limitNum),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// new release page api
const newRelease = async (req, res) => {
  try {
    const data = await movieOrWebSeries
      .find()
      .sort({ releaseDate: -1 })
      .populate("language genre");
    return res.status(200).json({
      success: true,
      message: "New Release Data Fetched Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// category page api
const categoryData = async (req, res) => {
  const { mainType = "MOVIE" } = req.query;
  try {
    const genreData = await Genre.find();
    const newReleaseData = await movieOrWebSeries
      .find({ mainType })
      .sort({ releaseDate: -1 })
      .limit(4);
    const trendingData = await movieOrWebSeries
      .find({
        mainType,
        imdbRating: { $gte: 7 },
      })
      .limit(4);

    return res.status(200).json({
      success: true,
      message: "All Category Data Fetched Successfully.",
      data: {
        genreData,
        newReleaseData: fixData(newReleaseData),
        trendingData: fixData(trendingData),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// search api with filter
const searchedFilterApi = async (req, res) => {
  const {
    mainType,
    genre,
    search,
    page = 1,
    limit = 20,
    sort = -1,
  } = req.query;
  const skip = (Number(page) - 1) * limit;
  let genreFilter = undefined;
  if (genre) {
    const genreArray = genre.split(",");
    genreFilter = { $in: genreArray };
  }

  const filter = {
    ...(mainType && { mainType }),
    ...(genreFilter && { genre: genreFilter }),
    ...(search && {
      $or: [
        { name: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { director: new RegExp(search, "i") },
        { writer: new RegExp(search, "i") },
        { "cast.name": new RegExp(search, "i") },
        { "subSeries.name": new RegExp(search, "i") },
        { "subSeries.description": new RegExp(search, "i") },
        { "subSeries.director": new RegExp(search, "i") },
        { "subSeries.writer": new RegExp(search, "i") },
        { "subSeries.cast.name": new RegExp(search, "i") },
      ],
    }),
  };
  try {
    const data = await movieOrWebSeries
      .find(filter)
      .sort({ createdAt: parseInt(sort) })
      .skip(skip)
      .limit(limit);
    const total = await movieOrWebSeries.countDocuments();

    return res.status(200).json({
      success: true,
      message: "All Data Fetched Successfully.",
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

module.exports = {
  homePage,
  trending,
  recommanded,
  newRelease,
  categoryData,
  searchedFilterApi,
};
