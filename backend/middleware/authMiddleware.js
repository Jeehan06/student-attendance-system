const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "role", "approvalStatus"],
    });

    if (!user) {
      return res.status(401).json({
        message: "Account not found",
      });
    }

    if (user.approvalStatus !== "APPROVED") {
      return res.status(403).json({
        message: "Your account is not approved for access",
        approvalStatus: user.approvalStatus,
      });
    }

    req.user = {
      id: user.id,
      role: user.role,
    };

    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return next();
  };
};

module.exports = {
  authenticate,
  authorize,
};