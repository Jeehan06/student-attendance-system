const {
  Subject,
  ClassSession,
  AttendanceSubmission,
  Attendance,
  AttendanceIssue,
  Student,
  User,
} = require("../models");

const sequelize = require("../config/database");

const createSubject = async (req, res) => {
  try {
    const { name, course, semester } = req.body;

    if (!name || !course || !semester) {
      return res.status(400).json({
        message: "Name, course and semester are required",
      });
    }

    const subject = await Subject.create({
      name,
      course,
      semester,
    });

    return res.status(201).json({
      message: "Subject created successfully",
      subject,
    });
  } catch (error) {
    console.error("Create subject error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      subjects,
    });
  } catch (error) {
    console.error("Get subjects error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const createClass = async (req, res) => {
  try {
    const { subjectId, date, startTime, endTime } = req.body;

    if (!subjectId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "Subject, date, start time and end time are required",
      });
    }

    const subject = await Subject.findByPk(subjectId);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    const classSession = await ClassSession.create({
      subjectId,
      date,
      startTime,
      endTime,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: "Class session created successfully",
      classSession,
    });
  } catch (error) {
    console.error("Create class error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getClasses = async (req, res) => {
  try {
    const classes = await ClassSession.findAll({
      include: [
        {
          model: Subject,
          as: "subject",
        },
      ],
      order: [
        ["date", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    return res.status(200).json({
      classes,
    });
  } catch (error) {
    console.error("Get classes error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getPendingSubmissions = async (req, res) => {
  try {
    const submissions = await AttendanceSubmission.findAll({
      include: [
        {
          model: Student,
          as: "student",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
        },
        {
          model: ClassSession,
          as: "class",
          include: [
            {
              model: Subject,
              as: "subject",
            },
          ],
        },
      ],
      order: [["submittedAt", "ASC"]],
    });

    const verifiedAttendance = await Attendance.findAll({
      attributes: ["studentId", "classId"],
    });

    const verifiedSet = new Set(
      verifiedAttendance.map(
        (attendance) =>
          `${attendance.studentId}-${attendance.classId}`
      )
    );

    const pendingSubmissions = submissions.filter(
      (submission) =>
        !verifiedSet.has(
          `${submission.studentId}-${submission.classId}`
        )
    );

    return res.status(200).json({
      submissions: pendingSubmissions,
    });
  } catch (error) {
    console.error("Get submissions error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/*
  NEW:
  Get the complete attendance sheet for one class.

  This returns every student belonging to the subject's
  course + semester, along with their submission if they
  have submitted one.
*/
const getClassAttendanceSheet = async (req, res) => {
  try {
    const { classId } = req.params;

    const classSession = await ClassSession.findByPk(classId, {
      include: [
        {
          model: Subject,
          as: "subject",
        },
      ],
    });

    if (!classSession) {
      return res.status(404).json({
        message: "Class session not found",
      });
    }

    const students = await Student.findAll({
      where: {
        course: classSession.subject.course,
        semester: classSession.subject.semester,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: AttendanceSubmission,
          as: "submissions",
          where: {
            classId: classSession.id,
          },
          required: false,
        },
      ],
      order: [[{ model: User, as: "user" }, "name", "ASC"]],
    });

    const existingAttendance = await Attendance.findAll({
      where: {
        classId: classSession.id,
      },
      attributes: ["id", "studentId", "status", "verifiedAt"],
    });

    return res.status(200).json({
      class: classSession,
      students,
      attendance: existingAttendance,
      uploaded: existingAttendance.length > 0,
    });
  } catch (error) {
    console.error("Get class attendance sheet error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/*
  NEW:
  Upload the entire class attendance to the official Attendance table.

  Expected body:

  {
    "attendance": [
      {
        "studentId": 1,
        "status": "PRESENT"
      },
      {
        "studentId": 2,
        "status": "ABSENT"
      }
    ]
  }
*/
const uploadClassAttendance = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { classId } = req.params;
    const { attendance } = req.body;

    if (!Array.isArray(attendance) || attendance.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        message: "Attendance list is required",
      });
    }

    const classSession = await ClassSession.findByPk(classId, {
      include: [
        {
          model: Subject,
          as: "subject",
        },
      ],
      transaction,
    });

    if (!classSession) {
      await transaction.rollback();

      return res.status(404).json({
        message: "Class session not found",
      });
    }

    const existingAttendance = await Attendance.findAll({
      where: {
        classId,
      },
      transaction,
    });

    if (existingAttendance.length > 0) {
      await transaction.rollback();

      return res.status(409).json({
        message: "Attendance for this class has already been uploaded",
      });
    }

    const students = await Student.findAll({
      where: {
        course: classSession.subject.course,
        semester: classSession.subject.semester,
      },
      attributes: ["id"],
      transaction,
    });

    const validStudentIds = new Set(
      students.map((student) => student.id)
    );

    if (attendance.length !== students.length) {
      await transaction.rollback();

      return res.status(400).json({
        message:
          "Attendance must be provided for every student in the class",
      });
    }

    const submittedStudentIds = new Set();

    for (const record of attendance) {
      if (!record.studentId || !record.status) {
        await transaction.rollback();

        return res.status(400).json({
          message: "Every attendance record needs studentId and status",
        });
      }

      if (!["PRESENT", "ABSENT"].includes(record.status)) {
        await transaction.rollback();

        return res.status(400).json({
          message: "Status must be PRESENT or ABSENT",
        });
      }

      if (!validStudentIds.has(Number(record.studentId))) {
        await transaction.rollback();

        return res.status(400).json({
          message:
            "One or more students do not belong to this class",
        });
      }

      if (submittedStudentIds.has(Number(record.studentId))) {
        await transaction.rollback();

        return res.status(400).json({
          message: "Duplicate student found in attendance list",
        });
      }

      submittedStudentIds.add(Number(record.studentId));
    }

    if (submittedStudentIds.size !== students.length) {
      await transaction.rollback();

      return res.status(400).json({
        message:
          "Attendance must contain exactly one record for every student",
      });
    }

    const attendanceRecords = attendance.map((record) => ({
      studentId: Number(record.studentId),
      classId: Number(classId),
      status: record.status,
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
    }));

    const createdAttendance = await Attendance.bulkCreate(
      attendanceRecords,
      {
        transaction,
      }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Class attendance uploaded successfully",
      count: createdAttendance.length,
      attendance: createdAttendance,
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Upload class attendance error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/*
  Kept for compatibility with the old API.
  The new admin UI will use bulk upload instead.
*/
const verifyAttendance = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await AttendanceSubmission.findByPk(
      submissionId
    );

    if (!submission) {
      return res.status(404).json({
        message: "Attendance submission not found",
      });
    }

    const existingAttendance = await Attendance.findOne({
      where: {
        studentId: submission.studentId,
        classId: submission.classId,
      },
    });

    if (existingAttendance) {
      return res.status(409).json({
        message: "Attendance has already been verified",
        attendance: existingAttendance,
      });
    }

    const attendance = await Attendance.create({
      studentId: submission.studentId,
      classId: submission.classId,
      status: submission.status,
      verifiedBy: req.user.id,
    });

    return res.status(201).json({
      message: "Attendance verified successfully",
      attendance,
    });
  } catch (error) {
    console.error("Verify attendance error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getAttendanceIssues = async (req, res) => {
  try {
    const issues = await AttendanceIssue.findAll({
      include: [
        {
          model: Student,
          as: "student",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
        },
        {
          model: Attendance,
          as: "attendance",
          include: [
            {
              model: ClassSession,
              as: "class",
              include: [
                {
                  model: Subject,
                  as: "subject",
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      issues,
    });
  } catch (error) {
    console.error("Get attendance issues error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const resolveAttendanceIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status, adminResponse, correctedStatus } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        message: "Status must be APPROVED or REJECTED",
      });
    }

    const issue = await AttendanceIssue.findByPk(issueId);

    if (!issue) {
      return res.status(404).json({
        message: "Attendance issue not found",
      });
    }

    if (issue.status !== "PENDING") {
      return res.status(409).json({
        message: "This attendance issue has already been resolved",
        issue,
      });
    }

    if (
      status === "APPROVED" &&
      !["PRESENT", "ABSENT"].includes(correctedStatus)
    ) {
      return res.status(400).json({
        message:
          "Corrected status must be PRESENT or ABSENT when approving an issue",
      });
    }

    const attendance = await Attendance.findByPk(
      issue.attendanceId
    );

    if (!attendance) {
      return res.status(404).json({
        message: "Official attendance record not found",
      });
    }

    if (status === "APPROVED") {
      attendance.status = correctedStatus;
      attendance.verifiedBy = req.user.id;
      attendance.verifiedAt = new Date();

      await attendance.save();
    }

    issue.status = status;
    issue.adminResponse = adminResponse || null;
    issue.resolvedBy = req.user.id;
    issue.resolvedAt = new Date();

    await issue.save();

    return res.status(200).json({
      message: `Attendance issue ${status.toLowerCase()} successfully`,
      issue,
      attendance,
    });
  } catch (error) {
    console.error("Resolve attendance issue error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
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
};