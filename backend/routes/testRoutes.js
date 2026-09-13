const express = require("express");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/student",
  authenticate,
  authorize("STUDENT"),
  (req, res) => {
    res.json({
      message: "Student access granted",
      user: req.user,
    });
  }
);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN"),
  (req, res) => {
    res.json({
      message: "Admin access granted",
      user: req.user,
    });
  }
);

module.exports = router;
