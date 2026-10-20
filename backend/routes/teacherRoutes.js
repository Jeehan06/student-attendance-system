const express = require("express");
const {
  getClasses,
  getClassSubmissions,
} = require("../controllers/teacherController");
const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/classes",
  authenticate,
  authorize("TEACHER"),
  getClasses
);

router.get(
  "/classes/:classId/submissions",
  authenticate,
  authorize("TEACHER"),
  getClassSubmissions
);

module.exports = router;