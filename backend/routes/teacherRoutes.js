const express = require("express");

const {
  getClasses,
  getClassSubmissions,
  getAvailableSubjects,
  claimSubject,
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

router.get(
  "/subjects/available",
  authenticate,
  authorize("TEACHER"),
  getAvailableSubjects
);

router.post(
  "/subjects/:subjectId/claim",
  authenticate,
  authorize("TEACHER"),
  claimSubject
);

module.exports = router;