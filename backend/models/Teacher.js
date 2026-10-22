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

  // Normalized link to the teacher's department.
  // Nullable until the staged migration is completed.
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // Legacy field retained temporarily for existing application code.
  department: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
});

module.exports = Teacher;
