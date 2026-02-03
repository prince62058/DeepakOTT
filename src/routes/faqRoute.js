const express = require("express");
const { getFAQById, getAllFAQ, createFAQ, deleteFaq, updateFAQ } = require("../controllers/faqController")

const router = express.Router();

// for user
router.get("/getFAQById", getFAQById);
router.get("/getAllFAQ", getAllFAQ);


// for admin
router.post("/createFAQ",  createFAQ);
router.get("/admin/getAllFAQ", getAllFAQ);
router.delete("/admin/deleteFaq", deleteFaq);
router.put("/admin/updateFAQ",  updateFAQ);




module.exports = router;