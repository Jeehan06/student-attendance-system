const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sequelize = require("../config/database");
const { User, Student, Teacher, Department } = require("../models");

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (password) =>
  typeof password === "string" && password.length >= 8;

const isValidSemester = (semester) => {
  const value = Number(semester);
  return Number.isInteger(value) && value >= 1 && value <= 12;
};

// STUDENT REGISTER
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, course, department, semester } =
      req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      !password ||
      typeof course !== "string" ||
      !course.trim() ||
      typeof department !== "string" ||
      !department.trim() ||
      semester === undefined ||
      semester === null ||
      semester === ""
    ) {
      return res.status(400).json({
        message:
          "Name, email, password, course, department, and semester are required",
      });
    }

    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    if (!isValidSemester(semester)) {
      return res.status(400).json({
        message: "Semester must be a whole number between 1 and 12",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const result = await sequelize.transaction(async (transaction) => {
      const existingUser = await User.findOne({
        where: { email: normalizedEmail },
        transaction,
      });

      if (existingUser) {
        return { duplicate: true };
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create(
        {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: "STUDENT",
          approvalStatus: "PENDING",
        },
        { transaction }
      );

      const student = await Student.create(
        {
          userId: user.id,
          course: course.trim(),
          department: department.trim(),
          semester: Number(semester),
        },
        { transaction }
      );

      return { user, student };
    });

    if (result.duplicate) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    if (result.departmentNotFound) {
      return res.status(400).json({
        message: "Department not found. Please enter an existing department name.",
      });
    }

    return res.status(201).json({
      message:
        "Registration submitted successfully. Your account is awaiting administrator approval.",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        approvalStatus: result.user.approvalStatus,
        student: {
          course: result.student.course,
          department: result.student.department,
          semester: result.student.semester,
        },
      },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    console.error("Student registration error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// TEACHER REGISTER
const registerTeacher = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      !password ||
      typeof department !== "string" ||
      !department.trim()
    ) {
      return res.status(400).json({
        message: "Name, email, password, and department are required",
      });
    }

    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const result = await sequelize.transaction(async (transaction) => {
      const existingUser = await User.findOne({
        where: { email: normalizedEmail },
        transaction,
      });

      if (existingUser) {
        return { duplicate: true };
      }

      const departmentRecord = await Department.findOne({
        where: sequelize.where(
          sequelize.fn("LOWER", sequelize.fn("BTRIM", sequelize.col("name"))),
          department.trim().toLowerCase()
        ),
        transaction,
      });

      if (!departmentRecord) {
        return { departmentNotFound: true };
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create(
        {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: "TEACHER",
          approvalStatus: "PENDING",
        },
        { transaction }
      );

      const teacher = await Teacher.create(
        {
          userId: user.id,
          department: departmentRecord.name,
          departmentId: departmentRecord.id,
        },
        { transaction }
      );

      return { user, teacher };
    });

    if (result.duplicate) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    return res.status(201).json({
      message:
        "Registration submitted successfully. Your account is awaiting administrator approval.",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        approvalStatus: result.user.approvalStatus,
        teacher: {
          department: result.teacher.department,
        },
      },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    console.error("Teacher registration error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      where: { email: normalizeEmail(email) },
      include: [
        {
          model: Student,
          as: "student",
          required: false,
        },
        {
          model: Teacher,
          as: "teacher",
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.approvalStatus === "PENDING") {
      return res.status(403).json({
        message: "Your account is awaiting administrator approval",
        approvalStatus: "PENDING",
      });
    }

    if (user.approvalStatus === "REJECTED") {
      return res.status(403).json({
        message:
          "Your registration was rejected. Please contact the administrator.",
        approvalStatus: "REJECTED",
      });
    }

    if (user.approvalStatus !== "APPROVED") {
      return res.status(403).json({
        message: "Your account is not approved for login",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        student: user.student || null,
        teacher: user.teacher || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  registerStudent,
  registerTeacher,
  login,
};