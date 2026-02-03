const jwt = require("jsonwebtoken");

const userModel = require("../models/userModels");

async function adminMiddleware(req, res, next) {
  const token = req.headers.authorization;

  try {
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const admin = await userModel.findById(decoded.id);

    if (!admin || admin.userType !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access denied.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = adminMiddleware;
