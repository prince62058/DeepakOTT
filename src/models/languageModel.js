const mongoose = require("mongoose");

const languageSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
   disable:{
    type:Boolean,
    default:false
  }
 
},{timestamps:true});

const Language = mongoose.model("Language", languageSchema);

module.exports =  Language;