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
  course: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Subject;
