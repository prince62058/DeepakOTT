const express = require("express");
const {getAllWatchHistoryByUserId, updatePlayTimeStamp,deletePlay,freeplanCheck} = require("../controllers/watchHistoryController");
const router = express.Router();



// for user
router.get("/getAllWatchHistoryByUserId", getAllWatchHistoryByUserId);
router.put("/updatePlayTimeStamp", updatePlayTimeStamp);
router.delete("/deletePlay", deletePlay);
router.post("/freeplanCheck", freeplanCheck);




module.exports = router;