const User = require("./User");
const Student = require("./Student");
const Teacher = require("./Teacher");
const Subject = require("./Subject");
const ClassSession = require("./Class");
const AttendanceSubmission = require("./AttendanceSubmission");
const Attendance = require("./Attendance");
const AttendanceIssue = require("./AttendanceIssue");
const CRAppointment = require("./CRAppointment");
const Department = require("./Department");
const Semester = require("./Semester");


// User <-> Student
User.hasOne(Student, {
  foreignKey: "userId",
  as: "student",
  onDelete: "CASCADE",
});

Student.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// User <-> Teacher
User.hasOne(Teacher, {
  foreignKey: "userId",
  as: "teacher",
  onDelete: "CASCADE",
});

Teacher.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Department <-> Semester
Department.hasMany(Semester, {
  foreignKey: "departmentId",
  as: "semesters",
  onDelete: "RESTRICT",
});

Semester.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department",
});

// Department <-> Teacher
Department.hasMany(Teacher, {
  foreignKey: "departmentId",
  as: "teachers",
  onDelete: "RESTRICT",
});

Teacher.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "departmentRecord",
});

// Semester <-> Subject
Semester.hasMany(Subject, {
  foreignKey: "semesterId",
  as: "subjects",
  onDelete: "RESTRICT",
});

Subject.belongsTo(Semester, {
  foreignKey: "semesterId",
  as: "semesterRecord",
});

// Teacher <-> Subject
Teacher.hasMany(Subject, {
  foreignKey: "teacherId",
  as: "subjects",
  onDelete: "RESTRICT",
});

Subject.belongsTo(Teacher, {
  foreignKey: "teacherId",
  as: "responsibleTeacher",
});

// Subject <-> ClassSession
Subject.hasMany(ClassSession, {
  foreignKey: "subjectId",
  as: "classes",
  onDelete: "CASCADE",
});

ClassSession.belongsTo(Subject, {
  foreignKey: "subjectId",
  as: "subject",
});

// User <-> ClassSession
User.hasMany(ClassSession, {
  foreignKey: "createdBy",
  as: "createdClasses",
});

ClassSession.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// Student <-> AttendanceSubmission
Student.hasMany(AttendanceSubmission, {
  foreignKey: "studentId",
  as: "submissions",
  onDelete: "CASCADE",
});

AttendanceSubmission.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

// ClassSession <-> AttendanceSubmission
ClassSession.hasMany(AttendanceSubmission, {
  foreignKey: "classId",
  as: "submissions",
  onDelete: "CASCADE",
});

AttendanceSubmission.belongsTo(ClassSession, {
  foreignKey: "classId",
  as: "class",
});

// Student <-> Attendance
Student.hasMany(Attendance, {
  foreignKey: "studentId",
  as: "attendance",
  onDelete: "CASCADE",
});

Attendance.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

// ClassSession <-> Attendance
ClassSession.hasMany(Attendance, {
  foreignKey: "classId",
  as: "attendance",
  onDelete: "CASCADE",
});

Attendance.belongsTo(ClassSession, {
  foreignKey: "classId",
  as: "class",
});

// User <-> Attendance (verification)
User.hasMany(Attendance, {
  foreignKey: "verifiedBy",
  as: "verifiedAttendances",
});

Attendance.belongsTo(User, {
  foreignKey: "verifiedBy",
  as: "verifier",
});

// Student <-> AttendanceIssue
Student.hasMany(AttendanceIssue, {
  foreignKey: "studentId",
  as: "attendanceIssues",
  onDelete: "CASCADE",
});

AttendanceIssue.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

// Attendance <-> AttendanceIssue
Attendance.hasMany(AttendanceIssue, {
  foreignKey: "attendanceId",
  as: "issues",
  onDelete: "CASCADE",
});

AttendanceIssue.belongsTo(Attendance, {
  foreignKey: "attendanceId",
  as: "attendance",
});

// User <-> AttendanceIssue (resolution)
User.hasMany(AttendanceIssue, {
  foreignKey: "resolvedBy",
  as: "resolvedIssues",
});

AttendanceIssue.belongsTo(User, {
  foreignKey: "resolvedBy",
  as: "resolver",
});

// Student <-> CRAppointment
Student.hasMany(CRAppointment, {
  foreignKey: "studentId",
  as: "crAppointments",
});

CRAppointment.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

// User <-> CRAppointment (appointing administrator)
User.hasMany(CRAppointment, {
  foreignKey: "appointedBy",
  as: "crAppointmentsMade",
});

CRAppointment.belongsTo(User, {
  foreignKey: "appointedBy",
  as: "appointingAdmin",
});

module.exports = {
  Department,
  Semester,
  User,
  Student,
  Teacher,
  Subject,
  ClassSession,
  AttendanceSubmission,
  Attendance,
  AttendanceIssue,
  CRAppointment,
};