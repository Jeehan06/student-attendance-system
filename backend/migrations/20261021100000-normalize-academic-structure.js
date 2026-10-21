"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Create Departments.
      await queryInterface.createTable(
        "Departments",
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(100),
            allowNull: false,
            unique: true,
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

      // 2. Create Semesters.
      await queryInterface.createTable(
        "Semesters",
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          departmentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: "Departments",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          semesterNumber: {
            type: Sequelize.INTEGER,
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

      await queryInterface.addConstraint("Semesters", {
        fields: ["departmentId", "semesterNumber"],
        type: "unique",
        name: "semesters_department_number_unique",
        transaction,
      });

      // 3. Add nullable foreign-key columns.
      // Legacy columns remain until the application is migrated.
      for (const table of ["Students", "Subjects"]) {
        await queryInterface.addColumn(
          table,
          "departmentId",
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: "Departments",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          { transaction }
        );

        await queryInterface.addColumn(
          table,
          "semesterId",
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: "Semesters",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          { transaction }
        );
      }

      await queryInterface.addColumn(
        "Teachers",
        "departmentId",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Departments",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "CRAppointments",
        "semesterId",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Semesters",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        { transaction }
      );

      // Subject offering -> responsible teacher.
      // Nullable during the staged migration; enforce required ownership
      // after admin assignment and existing offerings are handled.
      await queryInterface.addColumn(
        "Subjects",
        "teacherId",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Teachers",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        { transaction }
      );

      // 4. Create department records from existing academic data.
      await queryInterface.sequelize.query(
        `
          INSERT INTO "Departments" ("name", "createdAt", "updatedAt")
          SELECT MIN(source.name) AS name,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          FROM (
            SELECT NULLIF(BTRIM("department"), '') AS name
            FROM "Students"

            UNION

            SELECT NULLIF(BTRIM("course"), '')
            FROM "Students"

            UNION

            SELECT NULLIF(BTRIM("department"), '')
            FROM "Teachers"

            UNION

            SELECT NULLIF(
              BTRIM(COALESCE("department", "course")),
              ''
            )
            FROM "Subjects"

            UNION

            SELECT NULLIF(BTRIM("department"), '')
            FROM "CRAppointments"
          ) AS source
          WHERE source.name IS NOT NULL
          GROUP BY LOWER(source.name)
          ON CONFLICT ("name") DO NOTHING
        `,
        { transaction }
      );

      // 5. Create semester records from existing academic data.
      await queryInterface.sequelize.query(
        `
          INSERT INTO "Semesters"
            ("departmentId", "semesterNumber", "createdAt", "updatedAt")
          SELECT DISTINCT
            d.id,
            source.semesterNumber,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          FROM (
            SELECT
              COALESCE(
                NULLIF(BTRIM("department"), ''),
                NULLIF(BTRIM("course"), '')
              ) AS departmentName,
              "semester" AS semesterNumber
            FROM "Students"

            UNION

            SELECT
              NULLIF(BTRIM(COALESCE("department", "course")), ''),
              "semester"
            FROM "Subjects"

            UNION

            SELECT
              NULLIF(BTRIM("department"), ''),
              "semester"
            FROM "CRAppointments"
          ) AS source
          JOIN "Departments" d
            ON LOWER(BTRIM(d.name)) = LOWER(BTRIM(source.departmentName))
          WHERE source.semesterNumber IS NOT NULL
            AND source.semesterNumber > 0
          ON CONFLICT ("departmentId", "semesterNumber") DO NOTHING
        `,
        { transaction }
      );

      // 6. Link students to departments.
      await queryInterface.sequelize.query(
        `
          UPDATE "Students" AS s
          SET "departmentId" = d.id
          FROM "Departments" AS d
          WHERE LOWER(BTRIM(d.name)) = LOWER(COALESCE(
            NULLIF(BTRIM(s."department"), ''),
            NULLIF(BTRIM(s."course"), '')
          ))
        `,
        { transaction }
      );

      // Link students to semesters.
      await queryInterface.sequelize.query(
        `
          UPDATE "Students" AS s
          SET "semesterId" = sem.id
          FROM "Semesters" AS sem
          WHERE sem."departmentId" = s."departmentId"
            AND sem."semesterNumber" = s."semester"
        `,
        { transaction }
      );

      // 7. Link teachers to departments.
      await queryInterface.sequelize.query(
        `
          UPDATE "Teachers" AS t
          SET "departmentId" = d.id
          FROM "Departments" AS d
          WHERE LOWER(BTRIM(d.name)) = LOWER(NULLIF(BTRIM(t."department"), ''))
        `,
        { transaction }
      );

      // 8. Link subjects to departments.
      await queryInterface.sequelize.query(
        `
          UPDATE "Subjects" AS s
          SET "departmentId" = d.id
          FROM "Departments" AS d
          WHERE LOWER(BTRIM(d.name)) = LOWER(COALESCE(
            NULLIF(BTRIM(s."department"), ''),
            NULLIF(BTRIM(s."course"), '')
          ))
        `,
        { transaction }
      );

      // Link subjects to semesters.
      await queryInterface.sequelize.query(
        `
          UPDATE "Subjects" AS s
          SET "semesterId" = sem.id
          FROM "Semesters" AS sem
          WHERE sem."departmentId" = s."departmentId"
            AND sem."semesterNumber" = s."semester"
        `,
        { transaction }
      );

      // 9. Link CR appointments to their department semester.
      await queryInterface.sequelize.query(
        `
          UPDATE "CRAppointments" AS cr
          SET "semesterId" = sem.id
          FROM "Departments" AS d
          JOIN "Semesters" AS sem
            ON sem."departmentId" = d.id
          WHERE LOWER(BTRIM(d.name)) =
            LOWER(NULLIF(BTRIM(cr."department"), ''))
            AND sem."semesterNumber" = cr."semester"
        `,
        { transaction }
      );
      const [unlinked] = await queryInterface.sequelize.query(
        `SELECT
          (SELECT COUNT(*) FROM "Students"
            WHERE "departmentId" IS NULL OR "semesterId" IS NULL)
          +
          (SELECT COUNT(*) FROM "Subjects"
            WHERE "departmentId" IS NULL OR "semesterId" IS NULL)
          +
          (SELECT COUNT(*) FROM "Teachers"
            WHERE "departmentId" IS NULL)
          +
          (SELECT COUNT(*) FROM "CRAppointments"
            WHERE "semesterId" IS NULL) AS count`,
        { transaction }
      );

      if (Number(unlinked[0].count) > 0) {
        throw new Error(
          `Academic backfill incomplete: ${unlinked[0].count} record(s) remain unlinked.`
        );
      }

    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("Subjects", "teacherId", {
        transaction,
      });

      await queryInterface.removeColumn("CRAppointments", "semesterId", {
        transaction,
      });

      await queryInterface.removeColumn("Teachers", "departmentId", {
        transaction,
      });

      for (const table of ["Subjects", "Students"]) {
        await queryInterface.removeColumn(table, "semesterId", {
          transaction,
        });

        await queryInterface.removeColumn(table, "departmentId", {
          transaction,
        });
      }

      await queryInterface.dropTable("Semesters", { transaction });
      await queryInterface.dropTable("Departments", { transaction });
    });
  },
};