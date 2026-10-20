const {
  Student,
  ClassSession,
  Subject,
  AttendanceSubmission,
  Attendance,
  AttendanceIssue,
} = require("../models");

const getClasses = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { userId: req.user.id },
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const subjectFilter = {
      course: student.course,
      semester: student.semester,
    };

    if (student.department) {
      subjectFilter.department = student.department;
    }

    const classes = await ClassSession.findAll({
      include: [
        {
          model: Subject,
          as: "subject",
          where: subjectFilter,
        },
        {
          model: AttendanceSubmission,
          as: "submissions",
          where: { studentId: student.id },
          required: false,
        },
      ],
      order: [
        ["date", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    return res.status(200).json({ classes });
  } catch (error) {
    console.error("Get student classes error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const submitAttendance = async (req, res) => {
  try {
    const { classId, status } = req.body;
    const parsedClassId = Number(classId);

    if (
      !Number.isInteger(parsedClassId) ||
      parsedClassId <= 0 ||
      !["PRESENT", "ABSENT"].includes(status)
    ) {
      return res.status(400).json({
        message: "A valid class ID and status (PRESENT or ABSENT) are required",
      });
    }

    const student = await Student.findOne({
      where: { userId: req.user.id },
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const classSession = await ClassSession.findByPk(parsedClassId, {
      include: [{ model: Subject, as: "subject" }],
    });

    if (!classSession || !classSession.subject) {
      return res.status(404).json({ message: "Class session not found" });
    }

    const subject = classSession.subject;

    if (
      subject.course !== student.course ||
      Number(subject.semester) !== Number(student.semester) ||
      (student.department &&
        subject.department !== undefined &&
        subject.department !== student.department)
    ) {
      return res.status(403).json({
        message: "This class is not assigned to you",
      });
    }

    const existingSubmission = await AttendanceSubmission.findOne({
      where: {
        studentId: student.id,
        classId: parsedClassId,
      },
    });

    if (existingSubmission) {
      return res.status(409).json({
        message: "Attendance already submitted for this class",
        submission: existingSubmission,
      });
    }

    const submission = await AttendanceSubmission.create({
      studentId: student.id,
      classId: parsedClassId,
      status,
    });

    return res.status(201).json({
      message: "Attendance submitted successfully",
      submission,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Attendance already submitted for this class",
      });
    }

    console.error("Submit attendance error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { userId: req.user.id },
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const attendance = await Attendance.findAll({
      where: { studentId: student.id },
      include: [
        {
          model: ClassSession,
          as: "class",
          include: [{ model: Subject, as: "subject" }],
        },
      ],
      order: [
        [
          { model: ClassSession, as: "class" },
          "date",
          "DESC",
        ],
      ],
    });

    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(
      (record) => record.status === "PRESENT"
    ).length;
    const absentClasses = attendance.filter(
      (record) => record.status === "ABSENT"
    ).length;

    const percentage =
      totalClasses === 0
        ? 0
        : Number(((presentClasses / totalClasses) * 100).toFixed(2));

    return res.status(200).json({
      summary: {
        totalClasses,
        presentClasses,
        absentClasses,
        percentage,
      },
      attendance,
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const createAttendanceIssue = async (req, res) => {
  try {
    const { attendanceId, message } = req.body;
    const parsedAttendanceId = Number(attendanceId);

    if (
      !Number.isInteger(parsedAttendanceId) ||
      parsedAttendanceId <= 0 ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        message: "A valid attendance ID and issue message are required",
      });
    }

    const student = await Student.findOne({
      where: { userId: req.user.id },
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const attendance = await Attendance.findOne({
      where: {
        id: parsedAttendanceId,
        studentId: student.id,
      },
    });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const existingIssue = await AttendanceIssue.findOne({
      where: {
        attendanceId: attendance.id,
        studentId: student.id,
        status: "PENDING",
      },
    });

    if (existingIssue) {
      return res.status(409).json({
        message: "You already have a pending issue for this attendance",
        issue: existingIssue,
      });
    }

    const issue = await AttendanceIssue.create({
      studentId: student.id,
      attendanceId: attendance.id,
      message: message.trim(),
    });

    return res.status(201).json({
      message: "Attendance issue reported successfully",
      issue,
    });
  } catch (error) {
    console.error("Create attendance issue error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getClasses,
  submitAttendance,
  getAttendance,
  createAttendanceIssue,
};