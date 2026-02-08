const mongoose = require("mongoose");
const WatchHistory = require("./src/models/watchHistoryModel");

// --- CONNECT TO MONGODB ---
// Replace with your actual connection string from .env or config
const DB_URI =
  "mongodb+srv://satyakabir:Satyakabir123@cluster0.us4d62n.mongodb.net/DeepakOTT";

const clearHistory = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear ALL history (or specific user if I knew the ID, but user said 'sabko hta do')
    // Assuming 'sabko' means everything for current testing or maybe just for the current user.
    // Given the context of "check refresh trikese", clearing entire collection is safest for a dev env.

    const result = await WatchHistory.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} watch history entries.`);
  } catch (error) {
    console.error("❌ Error clearing history:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected");
  }
};

clearHistory();
