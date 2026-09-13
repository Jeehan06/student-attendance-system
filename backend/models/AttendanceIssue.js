const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AttendanceIssue = sequelize.define("AttendanceIssue", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  attendanceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
    allowNull: false,
    defaultValue: "PENDING",
  },
  adminResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resolvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = AttendanceIssue;
