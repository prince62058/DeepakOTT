const mongoose  = require("mongoose");

const likeRateSchema = mongoose.Schema({

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    movieOrSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MovieWebSeries",
    }

},

{timestamps:true}
);

const LikeRate = mongoose.model("LikeRate", likeRateSchema);
module.exports = LikeRate;