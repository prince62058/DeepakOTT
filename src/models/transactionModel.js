const mongoose = require("mongoose");

const transactionSechema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    amount:{
        type:Number,
    },
    Type:{
      type:String,
      enum: ["DEBIT", "CREDIT", "REFUND"]
    },

    status:{
        type:String,
        enum:["PENDING", "APPROVED", "REJECTED"],
        default:"PENDING"
    },
    transactionId :{
        type:String
    },
    bankOrUpiId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"BankAccount"
    },
    message:{
        type:String,
        trim:true,
        default:null
    }

},{timestamps:true})

const Transaction = mongoose.model("Transaction",transactionSechema);

module.exports = Transaction;

