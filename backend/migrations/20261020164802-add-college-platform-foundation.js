"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Add account approval fields.
      // Existing accounts remain approved by default.
      await queryInterface.addColumn(
        "Users",
        "approvalStatus",
        {
          type: Sequelize.ENUM("PENDING", "APPROVED", "REJECTED"),
          allowNull: false,
          defaultValue: "APPROVED",
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "Users",
        "approvedBy",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "Users",
        "approvedAt",
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );

      // 2. Add TEACHER to the existing PostgreSQL role enum.
      // This migration runs on PostgreSQL, where the enum change is
      // transactional. No TEACHER value is used before this transaction ends.
      await queryInterface.sequelize.query(
        `
          ALTER TYPE "enum_Users_role"
          ADD VALUE IF NOT EXISTS 'TEACHER'
        `,
        { transaction }
      );

      // 3. Add department while preserving the existing course column.
      await queryInterface.addColumn(
        "Students",
        "department",
        {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        { transaction }
      );

      // Preserve existing student cohort information.
      await queryInterface.sequelize.query(
        `
          UPDATE "Students"
          SET "department" = "course"
          WHERE "department" IS NULL
        `,
        { transaction }
      );

      // 4. Create teacher profiles.
      await queryInterface.createTable(
        "Teachers",
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: {
              model: "Users",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          department: {
            type: Sequelize.STRING(100),
            allowNull: false,
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        { transaction }
      );

      // 5. Create CR appointments.
      await queryInterface.createTable(
        "CRAppointments",
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          studentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: "Students",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          department: {
            type: Sequelize.STRING(100),
            allowNull: false,
          },
          semester: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          appointedBy: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: "Users",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          appointedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          endedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        { transaction }
      );

      await queryInterface.addIndex(
        "CRAppointments",
        ["department", "semester"],
        {
          name: "cr_appointments_department_semester_idx",
          transaction,
        }
      );

      // At most one active CR per department-semester cohort.
      await queryInterface.sequelize.query(
        `
          CREATE UNIQUE INDEX cr_appointments_one_active_per_cohort
          ON "CRAppointments" ("department", "semester")
          WHERE "isActive" = TRUE
        `,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          DROP INDEX IF EXISTS cr_appointments_one_active_per_cohort
        `,
        { transaction }
      );

      await queryInterface.dropTable("CRAppointments", { transaction });
      await queryInterface.dropTable("Teachers", { transaction });

      await queryInterface.removeColumn("Students", "department", {
        transaction,
      });

      await queryInterface.removeColumn("Users", "approvedAt", {
        transaction,
      });

      await queryInterface.removeColumn("Users", "approvedBy", {
        transaction,
      });

      await queryInterface.removeColumn("Users", "approvalStatus", {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
          DROP TYPE IF EXISTS "enum_Users_approvalStatus"
        `,
        { transaction }
      );

      // PostgreSQL enum values are not directly removable.
      // The TEACHER value is intentionally retained on rollback.
    });
  },
};