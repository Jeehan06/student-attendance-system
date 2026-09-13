const User = require("./User");
const Student = require("./Student");
const Subject = require("./Subject");
const ClassSession = require("./Class");
const AttendanceSubmission = require("./AttendanceSubmission");
const Attendance = require("./Attendance");
const AttendanceIssue = require("./AttendanceIssue");

User.hasOne(Student, {
  foreignKey: "userId",
  as: "student",
  onDelete: "CASCADE",
});

Student.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Subject.hasMany(ClassSession, {
  foreignKey: "subjectId",
  as: "classes",
  onDelete: "CASCADE",
});

ClassSession.belongsTo(Subject, {
  foreignKey: "subjectId",
  as: "subject",
});

User.hasMany(ClassSession, {
  foreignKey: "createdBy",
  as: "createdClasses",
});

ClassSession.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

Student.hasMany(AttendanceSubmission, {
  foreignKey: "studentId",
  as: "submissions",
  onDelete: "CASCADE",
});

AttendanceSubmission.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

ClassSession.hasMany(AttendanceSubmission, {
  foreignKey: "classId",
  as: "submissions",
  onDelete: "CASCADE",
});

AttendanceSubmission.belongsTo(ClassSession, {
  foreignKey: "classId",
  as: "class",
});

Student.hasMany(Attendance, {
  foreignKey: "studentId",
  as: "attendance",
  onDelete: "CASCADE",
});

Attendance.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

ClassSession.hasMany(Attendance, {
  foreignKey: "classId",
  as: "attendance",
  onDelete: "CASCADE",
});

Attendance.belongsTo(ClassSession, {
  foreignKey: "classId",
  as: "class",
});

User.hasMany(Attendance, {
  foreignKey: "verifiedBy",
  as: "verifiedAttendances",
});

Attendance.belongsTo(User, {
  foreignKey: "verifiedBy",
  as: "verifier",
});

Student.hasMany(AttendanceIssue, {
  foreignKey: "studentId",
  as: "attendanceIssues",
  onDelete: "CASCADE",
});

AttendanceIssue.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

Attendance.hasMany(AttendanceIssue, {
  foreignKey: "attendanceId",
  as: "issues",
  onDelete: "CASCADE",
});

AttendanceIssue.belongsTo(Attendance, {
  foreignKey: "attendanceId",
  as: "attendance",
});

User.hasMany(AttendanceIssue, {
  foreignKey: "resolvedBy",
  as: "resolvedIssues",
});

AttendanceIssue.belongsTo(User, {
  foreignKey: "resolvedBy",
  as: "resolver",
});

module.exports = {
  User,
  Student,
  Subject,
  ClassSession,
  AttendanceSubmission,
  Attendance,
  AttendanceIssue,
};
