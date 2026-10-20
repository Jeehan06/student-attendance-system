const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CRAppointment = sequelize.define("CRAppointment", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  appointedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  appointedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});

module.exports = CRAppointment;
