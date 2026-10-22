const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Teacher = sequelize.define("Teacher", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },

  // Legacy field retained during the transition.
  department: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  // Normalized department relationship.
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Teacher;
