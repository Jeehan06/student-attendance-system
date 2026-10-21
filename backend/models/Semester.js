const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Semester = sequelize.define(
  "Semester",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    semesterNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["departmentId", "semesterNumber"],
        name: "semesters_department_number_unique",
      },
    ],
  }
);

module.exports = Semester;
