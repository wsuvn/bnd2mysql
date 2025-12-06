// dboperations.js
import mssql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config = {
  user: process.env.DB_USR,
  password: process.env.DB_MDP,
  server: process.env.DB_SVR,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: false, // true for Azure
    enableArithAbort: true,
  },
};

const poolPromise = new mssql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ Connected to SQL Server");
    return pool;
  })
  .catch(err => {
    console.error("❌ Database connection failed", err);
  });

export { poolPromise };