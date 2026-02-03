const express = require("express");
const {createWishList, getAllWishListByUserId, deleteWishListById} = require("../controllers/wishListController");
const router = express.Router();



// for user
router.get("/getAllWishListByUserId", getAllWishListByUserId);
router.post("/createWishList", createWishList);
router.delete("/deleteWishListById", deleteWishListById);




module.exports = router;