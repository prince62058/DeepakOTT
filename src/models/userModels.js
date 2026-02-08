const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    email: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
    },
    number: {
      type: Number,
    },
    age: {
      type: Number,
    },
    address: {
      type: String,
    },
    otp: {
      type: String,
    },
    image: {
      type: String,
    },
    disable: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    userType: {
      type: String,
      enum: ["Admin", "User", "SubAdmin"],
      default: "User",
    },
    languages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Language",
      },
    ],
    genrePreferences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre",
      },
    ],
    existingUser: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
    },
    referralEarning: {
      type: Number,
      default: 0,
    },
    wallet: {
      type: Number,
      default: 0,
    },
    totalFreeTimeCompleted: {
      type: Boolean,
      default: false,
    },
    totalFreeTime: {
      type: Number,
      default: 5,
    },
    referBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  { timestamps: true },
);
userSchema.statics.ensureDefaultAdmin = async function () {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@ott.com";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123";

  const existingAdmin = await this.findOne({ userType: "Admin" });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await this.create({
      name: "Default Admin",
      email: adminEmail,
      password: hashedPassword,
      userType: "Admin",
    });

    console.log(
      `\nDefault admin created with email: ${adminEmail}. Update the password immediately.\n`,
    );
  }
};

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
