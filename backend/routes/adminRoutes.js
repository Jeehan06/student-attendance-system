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
  getPendingAccounts,
  updateAccountApproval,
} = require("../controllers/adminController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// SUBJECTS
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

// CLASSES
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

// ATTENDANCE SUBMISSIONS
router.get(
  "/submissions",
  authenticate,
  authorize("ADMIN"),
  getPendingSubmissions
);

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

router.post(
  "/submissions/:submissionId/verify",
  authenticate,
  authorize("ADMIN"),
  verifyAttendance
);

// ATTENDANCE ISSUES
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

// ACCOUNT APPROVAL
router.get(
  "/accounts/pending",
  authenticate,
  authorize("ADMIN"),
  getPendingAccounts
);

router.patch(
  "/accounts/:userId/approval",
  authenticate,
  authorize("ADMIN"),
  updateAccountApproval
);

module.exports = router;