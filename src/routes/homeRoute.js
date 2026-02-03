const express = require("express");
const {
homePage,
trending,
recommanded,
newRelease,
categoryData,
searchedFilterApi
} = require("../controllers/homeController");
const router = express.Router();


// for user
router.get("/homePage", homePage);
router.get("/trending", trending);
router.get("/recommanded", recommanded);
router.get("/newRelease", newRelease);
router.get("/categoryData", categoryData);
router.get("/searchedFilterApi", searchedFilterApi);




module.exports = router;
