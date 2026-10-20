require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");
require("./models");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connected successfully");

    // Database changes will be managed through explicit migrations.
    // Do not run sequelize.sync() during normal server startup.

    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        try {
          await sequelize.close();
          console.log("Database connection closed.");
          process.exit(0);
        } catch (error) {
          console.error("Error closing database connection:", error);
          process.exit(1);
        }
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exitCode = 1;
  }
};

startServer();