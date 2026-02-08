const express = require("express");
const notificationRoute = require("../controllers/notificationController");
const router = express.Router();

// for user
router.get(
  "/getAllNotificationByuserId",
  notificationRoute.getAllNotificationByuserId,
);
router.get("/getNotificationById", notificationRoute.getNotificationById);
router.get("/notificationSeenCount", notificationRoute.notificationSeenCount);
router.put("/clearAllNotifications", notificationRoute.clearAllNotifications);

// for admin
router.post("/admin/sendNotification", notificationRoute.sendNotification);

module.exports = router;
