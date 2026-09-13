require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");
require("./models");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connected successfully");

    await sequelize.sync();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
  }
};

startServer();
