const express = require("express");
const {
createOrUpdateLikeRate
} = require("../controllers/likeRateController");
const router = express.Router();



// for user
router.post("/createOrUpdateLikeRate", createOrUpdateLikeRate);

module.exports = router;
