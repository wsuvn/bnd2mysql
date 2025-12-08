import express from "express";
import { poolPromise } from "../dboperations.js"; // This exports the mysql2 promise pool
import { authenticateToken } from "../middleware/auth.js"; // 🔹 central auth middleware

const router = express.Router();
const safeParseJSON = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return value; // not valid JSON, leave as-is
  }
};
// ===== Protected: generic CALL function (MySQL) =====
router.post("/api/execProc", authenticateToken, async (req, res) => {

  let connection; // Declare connection for proper cleanup
  try {
    const { procName, ...params } = req.body;
    
    if (!procName) {
      return res.status(400).send("Procedure name required");
    }

    connection = await poolPromise.getConnection();
    const [checkResult] = await connection.query(
      `
        SELECT ROUTINE_NAME 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_TYPE = 'PROCEDURE' 
        AND ROUTINE_SCHEMA = DATABASE() 
        AND ROUTINE_NAME = ?
      `,
      [procName] // MySQL uses '?' placeholders for safety
    );

    if (checkResult.length === 0) {
      return res.status(400).send(`Procedure "${procName}" not found in database.`);
    }
    const paramValues = [];
    const placeholders = [];

    // Filter, collect, and sanitize parameter values dynamically
    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith("para")) {
        paramValues.push(value);
        placeholders.push("?"); // Add a placeholder for each parameter
      }
    }
    
    const qryString = `CALL ${procName}(${placeholders.join(", ")})`;
    const [resultRows] = await connection.query(qryString, paramValues);
    let parsedRows = [];
    
    // MySQL returns nested arrays and OkPackets — we keep only arrays of rows
    if (Array.isArray(resultRows)) {
      parsedRows = resultRows.map(r => {
        return Object.fromEntries(
          Object.entries(r).map(([key, val]) => [key, safeParseJSON(val)])
        );
      });
    }
    
    // If no resultsets, return "ok"
    if (cleanResult.length === 0) {
      return res.json({ status: "ok" });
    }

    return res.json(parsedRows);
  } catch (err) {
    console.error("🔥 execProc ERROR:", err);   // <-- add this
    res.status(500).send(`Server error: ${err.message}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
