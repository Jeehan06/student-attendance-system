const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Attendance = sequelize.define("Attendance", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("PRESENT", "ABSENT"),
    allowNull: false,
  },
  verifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ["studentId", "classId"],
    },
  ],
});

module.exports = Attendance;
