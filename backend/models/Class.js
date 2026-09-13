const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ClassSession = sequelize.define("ClassSession", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = ClassSession;
