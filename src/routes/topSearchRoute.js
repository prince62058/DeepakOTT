const express = require("express");
const {
 createTopSearch,
 pastTopSearchedData
} = require("../controllers/topSearchController");

const router = express.Router();

router.post("/createTopSearch", createTopSearch);
router.get("/pastTopSearchedData", pastTopSearchedData);


module.exports = router;
