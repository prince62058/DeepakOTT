const express = require("express");
const {
  createSubscription,
  updateSubscription,
  getAllSubscription,
  disableSubscription,
  deleteSubscription,
  imageToUrl,
} = require("../controllers/subscriptionController");
const { upload } = require("../middleware/multer");
const router = express.Router();

// for user
router.get("/getAllSubscription", getAllSubscription);

// for admin
router.post("/admin/createSubscription", createSubscription);
router.put("/admin/updateSubscription", updateSubscription);
router.put("/admin/disableSubscription", disableSubscription);
router.delete("/admin/deleteSubscription", deleteSubscription);

router.post("/imageToUrl", upload.single("image"), imageToUrl);

module.exports = router;
