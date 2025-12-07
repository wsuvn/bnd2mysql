// dboperations.js

import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();


const mysqlConfig = {
    host: process.env.DB_SVR,      
    user: process.env.DB_USR,
    password: process.env.DB_MDP,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(mysqlConfig);
const poolPromise = pool.promise();

poolPromise.getConnection()
    .then(connection => {
        // Release the connection back to the pool immediately after testing
        connection.release(); 
        console.log("✅ Connected to MySQL Server");
    })
    .catch(err => {
        console.error("❌ Database connection failed", err);
    });
export { poolPromise };
