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

  // Legacy fields retained during the transition.
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

  // Normalized academic relationships.
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  semesterId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // Assigned by an administrator; nullable until assignment is implemented.
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Subject;
