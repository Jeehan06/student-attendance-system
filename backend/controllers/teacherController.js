const {
  Teacher,
  ClassSession,
  Subject,
  AttendanceSubmission,
  Department,
  Semester,
} = require("../models");

const sequelize = require("../config/database");

const getAvailableSubjects = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({
      where: { userId: req.user.id },
    });

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    if (!teacher.departmentId) {
      return res.status(400).json({
        message: "Your teacher profile has no assigned department",
      });
    }

    const subjects = await Subject.findAll({
      where: {
        departmentId: teacher.departmentId,
        teacherId: null,
      },
      include: [
        {
          model: Department,
          as: "departmentRecord",
          required: false,
        },
        {
          model: Semester,
          as: "semesterRecord",
          required: false,
        },
      ],
      order: [
        ["semesterId", "ASC"],
        ["name", "ASC"],
      ],
    });

    return res.status(200).json({ subjects });
  } catch (error) {
    console.error("Get available subjects error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const claimSubject = async (req, res) => {
  try {
    const subjectId = Number(req.params.subjectId);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return res.status(400).json({
        message: "Invalid subject ID",
      });
    }

    const teacher = await Teacher.findOne({
      where: { userId: req.user.id },
    });

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    if (!teacher.departmentId) {
      return res.status(400).json({
        message: "Your teacher profile has no assigned department",
      });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const subject = await Subject.findByPk(subjectId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!subject) {
        return {
          status: 404,
          body: { message: "Subject not found" },
        };
      }

      // Cross-department claiming remains disabled.
      // Future extension: permit it only after explicit admin authorization.
      if (subject.departmentId !== teacher.departmentId) {
        return {
          status: 403,
          body: {
            message: "You can only claim subjects in your own department",
          },
        };
      }

      if (subject.teacherId !== null) {
        return {
          status: 409,
          body: {
            message: "This subject has already been claimed",
          },
        };
      }

      const [updatedCount] = await Subject.update(
        { teacherId: teacher.id },
        {
          where: {
            id: subject.id,
            teacherId: null,
            departmentId: teacher.departmentId,
          },
          transaction,
        }
      );

      if (updatedCount !== 1) {
        return {
          status: 409,
          body: {
            message: "This subject was claimed by another teacher",
          },
        };
      }

      const claimedSubject = await Subject.findByPk(subject.id, {
        transaction,
        include: [
          {
            model: Semester,
            as: "semesterRecord",
            required: false,
          },
        ],
      });

      return {
        status: 200,
        body: {
          message: "Subject claimed successfully",
          subject: claimedSubject,
        },
      };
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Claim subject error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getClasses = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({
      where: { userId: req.user.id },
    });

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const classes = await ClassSession.findAll({
      include: [
        {
          model: Subject,
          as: "subject",
          where: { teacherId: teacher.id },
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

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getClassSubmissions = async (req, res) => {
  try {
    const classId = Number(req.params.classId);

    if (!Number.isInteger(classId) || classId <= 0) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    const teacher = await Teacher.findOne({
      where: { userId: req.user.id },
    });

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const classSession = await ClassSession.findByPk(classId, {
      include: [
        {
          model: Subject,
          as: "subject",
          where: { teacherId: teacher.id },
        },
      ],
    });

    if (!classSession) {
      return res.status(404).json({
        message: "Class not found for your assigned subjects",
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

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getAvailableSubjects,
  claimSubject,
  getClasses,
  getClassSubmissions,
};