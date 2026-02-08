const express = require("express");
const {
  createGenre,
  getGenreById,
  getGenre,
  updateGenre,
  deleteGenre,
} = require("../controllers/genrePreferenceController");
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const router = express.Router();

// for user
router.get("/getGenreById", getGenreById);
router.get("/getGenre", getGenre);

// for admin
router.post("/admin/genres", adminMiddleware, createGenre);
router.patch("/admin/genres/:id", adminMiddleware, updateGenre);
router.delete("/admin/genres/:id", adminMiddleware, deleteGenre);

module.exports = router;
