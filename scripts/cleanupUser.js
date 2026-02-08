const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", async () => {
  console.log("✅ Connected to MongoDB");

  try {
    // Delete user with problematic createdAt field
    const result = await mongoose.connection.db.collection("users").deleteMany({
      number: 6205872519,
    });

    console.log(
      `✅ Deleted ${result.deletedCount} user(s) with number 6205872519`,
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
});
