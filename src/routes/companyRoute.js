const express = require("express");
const {
getCompany,
updateCompany
} = require("../controllers/companyController");
const {upload} = require("../middleware/multer")
const router = express.Router();

const uploadFields = upload.fields([
  { name: "icon", maxCount: 1 },
  { name: "favIcon", maxCount: 1 },
  { name: "loader", maxCount: 1 },
]);

// for user and admin
router.get("/getCompany", getCompany);

// for admin 
router.put("/admin/updateCompany",uploadFields, updateCompany);


module.exports = router;
