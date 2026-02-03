const express = require("express");
const {createPurchaseSubscription} = require("../controllers/purchaseSubscriptionController");
const router = express.Router();


router.post("/createPurchaseSubscription", createPurchaseSubscription);


module.exports = router;