const mongoose = require("mongoose");

const movieWebSeriesSchema = mongoose.Schema(
  {
    file: {
      type: String,
      trim: true
    },
    poster: {
      type: String,
      trim: true
    },
    teaserUrl: {
      type: String,
      trim: true
    },
    imdbRating: {
      type: Number,
      default: 10
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    releaseDate: {
      type: Date,
    },
    releaseYear: {
      type: Number,
    },
    director: {
      type: String,
      trim: true,
    },
    writer: {
      type: String,
      trim: true,
    },
    cast: [
      {
        name: { type: String, trim: true },
        role: { type: String, trim: true },
        image: { type: String, trim: true },
      },
    ],
    maturityInfo: {
      type: String,
      trim: true,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number, // in minutes
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    genre: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre",
      },
    ],
    language: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Language",
      },
    ],
    mainType: {
      type: String,
      enum: ["MOVIE", "WEB_SERIES"],
    },
    parentsSeries: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MovieWebSeries",
    },

    subSeries: [],

    // 👇 Added sessions array
    sessions: {
      type: [Number],
      default: [],
    },

    watchQuality: {
      type: String,
      default: "HD"
    },
    index: {
      type: Number,
    }

  },
  { timestamps: true }
);

// 👇 Auto update parent series sessions array when new episode/season added
movieWebSeriesSchema.post("save", async function (doc, next) {
  try {
    if (doc.parentsSeries) {
      const sessionNumber = doc.session || 1;
      await mongoose.model("MovieWebSeries").findByIdAndUpdate(
        doc.parentsSeries,
        { $addToSet: { sessions: sessionNumber } } // Prevent duplicates
      );
    }
    next();
  } catch (error) {
    console.error("Error updating sessions array:", error);
    next(error);
  }
});

const MovieWebSeries = mongoose.model("MovieWebSeries", movieWebSeriesSchema);
module.exports = MovieWebSeries;
