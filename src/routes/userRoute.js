const express = require("express");
const {
  sendOtp,
  verifyOtp,
  loginApi,
  profileApiByID,
  // getProfileByFilter,
  disableUserApi,
  updateProfile,
  updatePassword,
  logoutApi,
  forgetPassword,
  resetPassword,
  CreateProfile,
  adminLogin,
  getAllUsers,
	validateReferralCode,
	createSubAdmin,
} = require("../controllers/userControllers");
const { referralEarning } = require("../middleware/referralMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/send", sendOtp);
router.post("/verify", verifyOtp);
router.post("/login", loginApi);
router.post("/validateReferralCode", validateReferralCode);
router.get("/profile/:id", profileApiByID);
router.post("/CreateProfile", referralEarning, CreateProfile);
router.post("/admin/login", adminLogin);
router.get("/admin/users", adminMiddleware, getAllUsers);
router.get("/admin/users/:id", adminMiddleware, profileApiByID);
router.patch("/admin/users/:id/disable", adminMiddleware, disableUserApi);
router.put("/updateProfile", updateProfile);
router.get("/updatePassword/:id", updatePassword);
router.post("/logout",  logoutApi);
router.post("/forget", forgetPassword);
router.post("/reset", resetPassword);
router.post("/createSubAdmin", createSubAdmin);

module.exports = router;
