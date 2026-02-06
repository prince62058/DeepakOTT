const express = require("express");
const {
  uploadMovie,
  createMovieOrWebSeries,
  updateMovieOrWebSeries,
  getAllByFilter,
  getMovieOrSeriesById,
  getTrailerMovieOrSeriesById,
  deleteMovieOrWebSeries,
} = require("../controllers/movieWebSeriesController");
// const {upload} = require("../middleware/multer")
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// for user
router.get("/getAllByFilterMovieSeries", getAllByFilter);
router.get("/getMovieOrSeriesById", getMovieOrSeriesById);
router.get("/getTrailerMovieOrSeriesById", getTrailerMovieOrSeriesById);

// for admin
router.post("/uploadMovie", upload.single("movie"), uploadMovie);
router.post("/admin/createMovieOrWebSeries", createMovieOrWebSeries);
router.put("/admin/updateMovieOrWebSeries", updateMovieOrWebSeries);
router.delete("/admin/deleteMovieOrWebSeries/:id", deleteMovieOrWebSeries);

module.exports = router;
