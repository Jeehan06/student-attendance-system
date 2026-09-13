const express = require("express");

const {
  getClasses,
  submitAttendance,
  getAttendance,
  createAttendanceIssue,
} = require("../controllers/studentController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/classes",
  authenticate,
  authorize("STUDENT"),
  getClasses
);

router.post(
  "/attendance",
  authenticate,
  authorize("STUDENT"),
  submitAttendance
);

router.get(
  "/attendance",
  authenticate,
  authorize("STUDENT"),
  getAttendance
);

router.post(
  "/attendance/issues",
  authenticate,
  authorize("STUDENT"),
  createAttendanceIssue
);

module.exports = router;