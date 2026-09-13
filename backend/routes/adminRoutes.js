const express = require("express");

const {
  createSubject,
  getSubjects,
  createClass,
  getClasses,
  getPendingSubmissions,
  getClassAttendanceSheet,
  uploadClassAttendance,
  verifyAttendance,
  getAttendanceIssues,
  resolveAttendanceIssue,
} = require("../controllers/adminController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/subjects",
  authenticate,
  authorize("ADMIN"),
  createSubject
);

router.get(
  "/subjects",
  authenticate,
  authorize("ADMIN"),
  getSubjects
);

router.post(
  "/classes",
  authenticate,
  authorize("ADMIN"),
  createClass
);

router.get(
  "/classes",
  authenticate,
  authorize("ADMIN"),
  getClasses
);

router.get(
  "/submissions",
  authenticate,
  authorize("ADMIN"),
  getPendingSubmissions
);

/*
  New whole-class attendance workflow
*/
router.get(
  "/classes/:classId/attendance-sheet",
  authenticate,
  authorize("ADMIN"),
  getClassAttendanceSheet
);

router.post(
  "/classes/:classId/attendance-sheet/upload",
  authenticate,
  authorize("ADMIN"),
  uploadClassAttendance
);

/*
  Old single-submission endpoint kept for compatibility.
*/
router.post(
  "/submissions/:submissionId/verify",
  authenticate,
  authorize("ADMIN"),
  verifyAttendance
);

router.get(
  "/attendance/issues",
  authenticate,
  authorize("ADMIN"),
  getAttendanceIssues
);

router.patch(
  "/attendance/issues/:issueId",
  authenticate,
  authorize("ADMIN"),
  resolveAttendanceIssue
);

module.exports = router;