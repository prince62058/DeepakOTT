const express = require("express");
const cors = require("cors");

// Import all route files
const userRouter = require("./routes/userRoute");
const languageRouter = require("./routes/languageRoute");
const genreRouter = require("./routes/genrePreferenceRoute");
const companyRouter = require("./routes/companyRoute");
const faqRouter = require("./routes/faqRoute");
const notificationRoute = require("./routes/notificationRoute");
const bankRoute = require("./routes/bankAccountRoute");
const transactionRoute = require("./routes/transactionRoute");
const subscriptionRoute = require("./routes/subscriptionRoute");
const purchaseSubscriptionRoute = require("./routes/purchaseSubscriptionRoute");
const movieWebseriesRoute = require("./routes/movieWebSeriesRoute");
const watchHistoryRoute = require("./routes/watchHistoryRoute");
const wishListRoute = require("./routes/wishListRoute");
const homeRoute = require("./routes/homeRoute");
const topSearchRoute = require("./routes/topSearchRoute");
const likeRateRoute = require("./routes/likeRateRoute");
const movieRentRoute = require("./routes/movieRentRoute");
const dashboardRoute = require("./routes/dashboardRoute");

const app = express();

// -----------------------------
// 🧩 Middlewares
// -----------------------------
app.use(
  cors({
    origin: "*", // You can restrict to specific domains later
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve static files from 'public' directory

// -----------------------------
// 🩺 Health and Root Routes
// -----------------------------
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK" });
});

// -----------------------------
// 🧭 API Routes (Versioned)
// -----------------------------
app.use("/api", userRouter);
app.use("/api", languageRouter);
app.use("/api", genreRouter);
app.use("/api", companyRouter);
app.use("/api", faqRouter);
app.use("/api", notificationRoute);
app.use("/api", bankRoute);
app.use("/api", transactionRoute);
app.use("/api", subscriptionRoute);
app.use("/api", purchaseSubscriptionRoute);
app.use("/api", movieWebseriesRoute);
app.use("/api", watchHistoryRoute);
app.use("/api", wishListRoute);
app.use("/api", homeRoute);
app.use("/api", topSearchRoute);
app.use("/api", likeRateRoute);
app.use("/api", movieRentRoute);
app.use("/api", dashboardRoute);

// -----------------------------
// 📱 Android App Link (Deep Link Verification)
// -----------------------------
app.get("/.well-known/assetlinks.json", (req, res) => {
  try {
    res.status(200).json([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.deepakott",
          sha256_cert_fingerprints: [
            "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C",
            "F6:06:DD:23:2C:F3:EA:8B:93:59:48:06:7B:E6:32:67:D0:32:7C:0F:AF:40:70:0C:67:BD:C1:E9:6F:13:2E:A8",
          ],
        },
      },
    ]);
  } catch (error) {
    console.error("Error serving assetlinks.json:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// -----------------------------
// ⚠️ 404 Handler (if route not found)
// -----------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// -----------------------------
// 💥 Global Error Handler
// -----------------------------
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// -----------------------------
// 🚀 Export App
// -----------------------------
module.exports = app;
