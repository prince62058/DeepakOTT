const express = require("express");
const {
  createbankAccountDetails,
  deleteBankAccountDetails,
  getBankAccountDetailsById,
  getAllBankAccountDetailsOfUser,
} = require("../controllers/bankAccountController.js");

const router = express.Router();

router.post("/createbankAccountDetails", createbankAccountDetails);
router.get("/getBankAccountDetailsById", getBankAccountDetailsById);
router.get("/getAllBankAccountDetailsOfUser", getAllBankAccountDetailsOfUser);
router.delete("/deleteBankAccountDetails", deleteBankAccountDetails);

module.exports = router;
