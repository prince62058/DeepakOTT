const LikeRate = require("../models/likeRateModel");

// toggle working - Like Rate create api
const createOrUpdateLikeRate = async (req, res) => {
  const { userId, movieOrSeriesId } = req.body;
  try {
    if (!userId || !movieOrSeriesId) {
      return res.status(400).json({
        success: false,
        message: "userId and movieOrSeriesId are required !",
      });
    }

    const normalizedId = movieOrSeriesId.includes("_nested_")
      ? movieOrSeriesId.split("_nested_")[0]
      : movieOrSeriesId;

    const existData = await LikeRate.findOne({
      userId,
      movieOrSeriesId: normalizedId,
    });

    if (existData) {
      await LikeRate.findByIdAndDelete(existData._id);
    } else {
      await LikeRate.create({ userId, movieOrSeriesId: normalizedId });
    }

    return res.status(200).json({
      success: true,
      message: existData ? "Unlike Successfully." : "Like Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createOrUpdateLikeRate,
};
