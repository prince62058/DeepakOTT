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
          .sort({ updatedAt: -1 }) // Sort by most recently watched
          .limit(50) // Fetch more to allow for filtering
          .populate({
            path: "movieOrSeriesId",
            populate: [
              { path: "genre", model: "Genre" },
              { path: "language", model: "Language" },
            ],
          }),
        movieOrWebSeries
          .find({
            imdbRating: { $gte: 7 },
            parentsSeries: { $in: [null, undefined] }, // Only parent series, not episodes
          })
          .limit(4)
          .populate("language genre"),
        movieOrWebSeries
          .find({
            ...recommandedQuery,
            parentsSeries: { $in: [null, undefined] }, // Only parent series, not episodes
          })
          .limit(4)
          .populate("language genre"),
        movieOrWebSeries
          .find({ parentsSeries: { $in: [null, undefined] } }) // Only parent series, not episodes
          .populate("language genre")
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    // 🔍 Debug logging
    console.log("📊 Watch History Debug:");
    console.log(`  Total records found: ${watchHistoryData.length}`);
    console.log(`  User ID: ${userId}`);

    // Filter and log each item
    const filteredWatchHistory = watchHistoryData
      .filter((item, index) => {
        if (!item.movieOrSeriesId) {
          console.log(
            `  ❌ Item ${index}: Missing movieOrSeriesId (deleted movie)`,
          );
          return false;
        }

        const totalDurationMinutes = item.movieOrSeriesId?.totalDuration || 0;
        const totalDurationSeconds = totalDurationMinutes * 60;
        let playTimeSeconds = item.playTimeStamps || 0;

        // 🔧 FIX: Normalize to seconds
        // If playTime is very small (< duration * 2) and duration is large, it MIGHT be minutes.
        // But for "Auto-Remove", we should assume the new standard (seconds) is taking over.
        // If we treat it as minutes when it's seconds, we get huge numbers (e.g. 2000 mins).
        // If we treat it as seconds when it's minutes, we get tiny numbers (e.g. 5 seconds for a 5 min view).

        // Converting legacy "minutes" to seconds if detected
        // HEURISTIC: If value is < totalDurationMinutes * 2 AND value < 300 (5 hours), it *might* be minutes.
        // However, safest is to trust the new "seconds" precision from the app.
        // If the app is sending seconds, playTimeStamps will be large (e.g. 1200 for 20 mins).

        // Let's rely on percentage logic:
        let percentageWatched = 0;

        if (totalDurationSeconds > 0) {
          // Case A: It's meant to be Seconds
          const pctAssumedSeconds =
            (playTimeSeconds / totalDurationSeconds) * 100;

          // Case B: It's meant to be Minutes (Leafacy)
          const pctAssumedMinutes =
            (playTimeSeconds / totalDurationMinutes) * 100;

          // Logic: precise match wins, or the one that makes "sense" (<= 100%)
          if (pctAssumedSeconds <= 100) {
            percentageWatched = pctAssumedSeconds;
          } else if (pctAssumedMinutes <= 100) {
            // It was likely minutes
            playTimeSeconds = playTimeSeconds * 60;
            percentageWatched = pctAssumedMinutes;
          } else {
            // Over 100% - likely completed/glitch
            percentageWatched = 100;
          }
        }

        const keep = percentageWatched < 95; // Remove if > 95% watched

        console.log(
          `  ${keep ? "✅" : "❌"} Item ${index} (${item.movieOrSeriesId?.name}):`,
        );
        console.log(
          `      Played: ${(playTimeSeconds / 60).toFixed(1)}min / ${totalDurationMinutes}min (${percentageWatched.toFixed(1)}%)`,
        );
        console.log(`      Raw timestamp: ${item.playTimeStamps}`);

        return keep;
      })
      .slice(0, 4)
      .map((item) => {
        // 🔧 NORMALIZATION: Ensure frontend receives strict SECONDS
        const totalDurationMinutes = item.movieOrSeriesId?.totalDuration || 0;
        const totalDurationSeconds = totalDurationMinutes * 60;
        let playTime = item.playTimeStamps || 0;

        // Heuristic: If value is suspiciously small (likely minutes) relative to duration
        // Heuristic: If value is suspiciously small (likely minutes) relative to duration
        // if (totalDurationSeconds > 0) {
        //   const pctAsSeconds = (playTime / totalDurationSeconds) * 100;
        //   const pctAsMinutes = (playTime / totalDurationMinutes) * 100;

        //   // If it makes sense as minutes (<=100%) but would be tiny as seconds (<1%)
        //   if (pctAsSeconds < 1 && pctAsMinutes > 1 && pctAsMinutes <= 100) {
        //     playTime = playTime * 60; // Convert to seconds
        //   }
        // }

        // Return a shallow copy with normalized timestamp
        // Use 'toObject()' or spread if it's a Mongoose doc, but .lean() isn't used so spread is safer on ._doc or strict object
        const newItem = item.toObject ? item.toObject() : { ...item };
        newItem.playTimeStamps = Math.floor(playTime);
        return newItem;
      });

    console.log(
      `  📋 Final count after filtering: ${filteredWatchHistory.length}`,
    );
    console.log("─".repeat(60));

    return res.status(200).json({
      success: true,
      message: "Home Data Fetched Successfully.",
      data: {
        userData,
        watchHistoryData: fixData(filteredWatchHistory),
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
    const filter = {
      imdbRating: { $gte: 7 },
      parentsSeries: { $in: [null, undefined] }, // Only parent series, not episodes
    };
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
      data: fixData(trendingData),
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
    let recommandedQuery = { parentsSeries: { $in: [null, undefined] } }; // Only parent series, not episodes
    if (userData.genrePreferences && userData.genrePreferences.length > 0) {
      recommandedQuery = {
        genre: { $in: userData.genrePreferences },
        parentsSeries: { $in: [null, undefined] }, // Only parent series, not episodes
      };
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
      data: fixData(recommandedData),
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
      .find({ parentsSeries: { $in: [null, undefined] } }) // Only parent series, not episodes
      .sort({ createdAt: -1 }) // Show newest first
      .populate("language genre");
    return res.status(200).json({
      success: true,
      message: "New Release Data Fetched Successfully.",
      data: fixData(data),
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
    // Find distinct genres used by movies/series of this mainType
    const validGenreIds = await movieOrWebSeries.distinct("genre", {
      mainType,
    });

    // Only fetch genres that are actually used
    const genreData = await Genre.find({ _id: { $in: validGenreIds } });

    // Fallback: If no content exists, genreData will be empty, which is correct.
    // Filter out child episodes - only show parent series
    const newReleaseData = await movieOrWebSeries
      .find({
        mainType,
        parentsSeries: { $in: [null, undefined] }, // Only parent series, not episodes
      })
      .sort({ createdAt: -1 }) // Show newest first
      .limit(4);
    const trendingData = await movieOrWebSeries
      .find({
        mainType,
        imdbRating: { $gte: 7 },
        parentsSeries: { $in: [null, undefined] }, // Only parent series, not episodes
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
    parentsSeries: { $in: [null, undefined] }, // Only parent series, not episodes
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
    const total = await movieOrWebSeries.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "All Data Fetched Successfully.",
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
  homePage,
  trending,
  recommanded,
  newRelease,
  categoryData,
  searchedFilterApi,
};
