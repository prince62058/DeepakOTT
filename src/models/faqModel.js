const mongoose = require("mongoose");

const faqSchema = mongoose.Schema({
    question:{
        type:String,
        trim:true
    },
    answer:{
        type:String,
        trim:true
    },
    disable:{
        type:Boolean,
        default:false
    }
},
{timestamps:true}
);

const Faq = mongoose.model("Faq", faqSchema);

module.exports = Faq;