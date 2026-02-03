const express = require("express");
const {
  createTransaction,
  getListTransactionByUserId,
  getTransactionById,
  updateTransactionStatus,
} = require("../controllers/transactionController");

const router = express.Router();

router.post("/createTransaction", createTransaction);
router.get("/getListTransactionByUserId", getListTransactionByUserId);
router.get("/getTransactionById", getTransactionById);

// for admin
router.put("/admin/updateTransactionStatus", updateTransactionStatus);

module.exports = router;
