const mongoose = require("mongoose");

const wishListSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    movieOrSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MovieWebSeries",
    },
    playTimeStamps: {
      type: Number, // in minutes
      default: 0,
    },
    mainType: {
      type: String,
      enum: ["MOVIE", "WEB_SERIES"],
    },
  },
  { timestamps: true }
);

const WishList = mongoose.model("WishList", wishListSchema);
module.exports = WishList;
