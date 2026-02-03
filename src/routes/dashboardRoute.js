const express = require("express");
const { getDashboardSummary } = require("../controllers/dashboardController");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/admin/dashboard", getDashboardSummary);

module.exports = router;
