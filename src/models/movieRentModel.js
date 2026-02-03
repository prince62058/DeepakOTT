const mongoose = require("mongoose");

const movieRentSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    movieId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "MovieWebSeries",
        },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    planStartTime: {
      type: Date,
    },
    planExpireTime: {
      type: Date,
    },
    isActivePlan: {
      type: Boolean,
      default: true,
    },
  },

  { timestamps: true }
);

const MovieRent = mongoose.model("MovieRent", movieRentSchema);
module.exports = MovieRent;
