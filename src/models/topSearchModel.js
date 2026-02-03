const mongoose = require("mongoose");

const topSearchSchema = mongoose.Schema({

    movieWebSeriesId:{
       type:mongoose.Schema.Types.ObjectId,
       ref:"MovieWebSeries"
    },
    count:{
        type:Number,
        default:1
    }

},

{timestamps:true}
);

const TopSearch  = mongoose.model("TopSearch", topSearchSchema);

module.exports = TopSearch;