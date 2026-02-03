// const mongoose = require("mongoose");
// const { createDefaultCompany } = require("../models/companyModel");
// const User = require("../models/userModels");

// async function connectToDB() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URL);
//     console.log("conndect to db");

//     await User.ensureDefaultAdmin(); 
//     await createDefaultCompany();

//     // background scheduling task
//     require("../utils/backgroundSchedulingTask");
//   } catch (error) {
//     console.log("not conndect ", error);
//   }
// }

// module.exports = connectToDB;

const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");
const User = require("../models/userModels");
const { createDefaultCompany } = require("../models/companyModel");

mongoose.set("strictQuery", true);

// --------------------
// 🔧 Mongo Config
// --------------------
const MONGO_URI = process.env.MONGODB_URL;

const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,

  // 🔥 Performance & Stability
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT || 30000),
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT || 45000),
  waitQueueTimeoutMS: Number(process.env.MONGO_WAIT_QUEUE_TIMEOUT || 10000),

  retryWrites: true,
  w: "majority",
  appName: "OTT-API",
};

// --------------------
// 🚀 Connect DB
// --------------------
const connectToDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, mongoOptions);
    console.log("✅ MongoDB Connected");

    attachConnectionListeners(mongoose.connection);

    // 🧑‍💼 Default Data
    await User.ensureDefaultAdmin(); 
    await createDefaultCompany();

    // ⏱ Background Jobs
    require("../utils/backgroundSchedulingTask");

  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

// --------------------
// 🧑‍💼 Default Admin
// --------------------
async function ensureDefaultAdmin() {
  const count = await userModel.estimatedDocumentCount();
  if (count > 0) return;

  const encryptedPassword = CryptoJS.AES.encrypt(
    "12345678",
    process.env.CRYPTOKEY || "CRYPTOKEY"
  ).toString();

  await userModel.create({
    _id: "64ddafdb7f21b2c8878e0001",
    email: "admin@ottapp.com",
    password: encryptedPassword,
    userType: "ADMIN",
    role: 2,
  });

  console.log("✅ Default Admin Created");
}


// --------------------
// 🔌 Mongo Events
// --------------------
function attachConnectionListeners(connection) {
  connection.on("connected", () => console.log("🟢 MongoDB connected"));
  connection.on("reconnected", () => console.log("🟡 MongoDB reconnected"));
  connection.on("disconnected", () => console.log("🔴 MongoDB disconnected"));
  connection.on("error", err => console.error("❌ MongoDB error:", err));
}

module.exports = connectToDB;
