const mongoose = require("mongoose");

const watchHistorySchema = mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    movieOrSeriesId:{
       type:mongoose.Schema.Types.ObjectId,
        ref:"MovieWebSeries"
    },
    playTimeStamps:{
        type:Number, // in minutes
        default:0
    },
    mainType:{
        type:String,
   enum: ["MOVIE", "WEB_SERIES"],
    }

},
{timestamps:true}
);

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
module.exports = WatchHistory;