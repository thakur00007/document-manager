import app from "./app.js";
import { sequelize } from "./db/db.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});
const port = process.env.NODE_SERVER_PORT || 4000;

sequelize
  .sync({ alter: false })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });
