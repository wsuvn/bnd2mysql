import express from "express";
import { poolPromise } from "../dboperations.js"; // Exports the mysql2 promise pool
import { authenticateToken } from "../middleware/auth.js"; // 🔹 central auth middleware

const router = express.Router();

// ===== Protected: generic single table UPDATE function (MySQL) =====
router.post("/api/updateSingleTable", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { tableName: tblName, Condi: dkWhere, CondiParams: dkParams = [], ...updateFields } = req.body;

    if (!tblName || !dkWhere || dkWhere.trim().toUpperCase() === "TRUE" || dkWhere.trim() === "1=1") {
      return res.status(400).send("Invalid request. Table name and a specific condition are required.");
    }

    connection = await poolPromise.getConnection();
    
    const [checkResult] = await connection.query(
      `
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_TYPE = 'BASE TABLE' 
        AND TABLE_NAME = ?
      `,
      [tblName]
    );

    if (checkResult.length === 0) {
      return res.status(400).send(`Table "${tblName}" not found in database.`);
    }

    const updateClauses = [];
    const allParamValues = []; // Array to hold ALL parameter values (Update values first, then Where values)

    for (const [key, value] of Object.entries(updateFields)) {
      updateClauses.push(`${key} = ?`); 
      allParamValues.push(value);
    }

    if (updateClauses.length === 0) {
      return res.status(400).send("No fields provided for update.");
    }
    
    if (Array.isArray(dkParams)) {
        allParamValues.push(...dkParams);
    }

    const qryString = `UPDATE ${tblName} SET ${updateClauses.join(", ")} WHERE ${dkWhere}`;
    
    const [result] = await connection.query(qryString, allParamValues);

    res.json({ 
        message: "Update successful",
        affectedRows: result.affectedRows 
    });

  } catch (err) {
    console.error("Database or API error:", err);
    res.status(500).send(`Server error: ${err.message}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
