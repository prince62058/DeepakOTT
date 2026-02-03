const express = require("express");
const {
createMovieRent,
getAllMovieRentByUserId
} = require("../controllers/movieRentController");
const router = express.Router();



// for user
router.post("/createMovieRent", createMovieRent);
router.post("/getAllMovieRentByUserId", getAllMovieRentByUserId);


module.exports = router;
