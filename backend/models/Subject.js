const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Subject = sequelize.define("Subject", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Normalized links; nullable during the staged transition.
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  semesterId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // Legacy fields retained for compatibility with existing code.
  course: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Subject;