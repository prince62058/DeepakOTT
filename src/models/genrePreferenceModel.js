const mongoose = require("mongoose");

const genreSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  image:{
    type:String,
    trim:true
  },
  disable:{
    type:Boolean,
    default:false
  }
 
 
},{timestamps:true});

const Genre = mongoose.model("Genre", genreSchema);

module.exports =  Genre;