const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    image: {
      type: String,
    },
    title: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "general",
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
