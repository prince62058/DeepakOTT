const jwt = require("jsonwebtoken");

const userModel = require("../models/userModels");
const { checkBlacklistUser } = require("../utils/blacklistUser");

async function userMiddleware(req, res, next) {
  const token = req.headers.authorization;
  try {
    if (!token) {
      return res.status(500).json({
        sucess: false,
        message: "token invalid",
      });
    }
    if (checkBlacklistUser(token)) {
      return res.status(500).json({
        sucess: false,
        message: " user token expired or logut",
      });
    }
    const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!verifyToken) {
      return res.status(500).json({
        sucess: false,
        message: "user token does not correct",
      });
    }

    const findUser = await userModel.findById(verifyToken.id);

    req.user = findUser;
    next();
  } catch (error) {
    return res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
}

module.exports = userMiddleware;
