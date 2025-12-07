import express from "express";
import { poolPromise } from "../dboperations.js"; // This exports the mysql2 promise pool
import { authenticateToken } from "../middleware/auth.js"; // 🔹 central auth middleware

const router = express.Router();
// ===== Protected: generic CALL function (MySQL) =====
router.post("/api/execProc", authenticateToken, async (req, res) => {

  console.log(">>> RAW BODY:", req.body);  
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
console.log(">>> RAW BODY:", req.body);

    const paramValues = [];
    const placeholders = [];

    // Filter, collect, and sanitize parameter values dynamically
    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith("para")) {
        paramValues.push(value);
        placeholders.push("?"); // Add a placeholder for each parameter
      }
    }
console.log(paramValues)
console.log(placeholders)
    
    const qryString = `CALL ${procName}(${placeholders.join(", ")})`;
console.log (qryString)    
    const [resultRows] = await connection.query(qryString, paramValues);
    const finalResultSets = resultRows.filter(Array.isArray);
    res.json(finalResultSets);

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
