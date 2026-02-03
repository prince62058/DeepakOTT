const express = require("express");
const {
  createLanguage,
  getLanguageById,
  getLanguages,
  updateLanguage,
} = require("../controllers/languageController");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// for user
router.get("/getLanguageById", getLanguageById);
router.get("/getLanguages", getLanguages);

// for admin
router.post("/admin/createLanguage", adminMiddleware, createLanguage);
router.patch("/admin/languages/:id", adminMiddleware, updateLanguage);

module.exports = router;
