import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE_NAME,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    logging: true, // TODO logging
    port: process.env.MYSQL_PORT,
    // timezone: "+05:30", // Set timezone to IST
    dialectOptions: {
      // useUTC: false, // for reading from database
      // dateStrings: true,
      // typeCast: true,
    },
    pool: {
      evict: Number(process.env.MYSQL_DATABASE_CONNECTION_EVICT),
      max: Number(process.env.MYSQL_DATABASE_CONNECTION_LIMIT),
      acquire: Number(process.env.MYSQL_DATABASE_CONNECTION_TIMEOUT),
      idle: Number(process.env.MYSQL_DATABASE_CONNECTION_IDLE),
    },
  }
);

export { sequelize };
