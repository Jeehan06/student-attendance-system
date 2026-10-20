const {
  Teacher,
  ClassSession,
  Subject,
  AttendanceSubmission,
} = require("../models");

const getClasses = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({
      where: { userId: req.user.id },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const classes = await ClassSession.findAll({
      include: [
        {
          model: Subject,
          as: "subject",
          where: { department: teacher.department },
        },
      ],
      order: [
        ["date", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    return res.status(200).json({ classes });
  } catch (error) {
    console.error("Get teacher classes error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getClassSubmissions = async (req, res) => {
  try {
    const classId = Number(req.params.classId);

    if (!Number.isInteger(classId) || classId <= 0) {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    const teacher = await Teacher.findOne({
      where: { userId: req.user.id },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const classSession = await ClassSession.findByPk(classId, {
      include: [
        {
          model: Subject,
          as: "subject",
          where: { department: teacher.department },
        },
      ],
    });

    if (!classSession) {
      return res.status(404).json({
        message: "Class not found in your department",
      });
    }

    const submissions = await AttendanceSubmission.findAll({
      where: { classId },
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      class: classSession,
      submissions,
    });
  } catch (error) {
    console.error("Get teacher class submissions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getClasses,
  getClassSubmissions,
};