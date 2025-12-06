import express from "express";
import { poolPromise } from "../dboperations.js";
import { authenticateToken } from "../middleware/auth.js";  // 🔹 central auth middleware

const router = express.Router();

// ===== Protected: generic SELECT function =====
router.put("/api/updateSingleTable", authenticateToken, async (req, res) => {
  try {
    const { tableName: tblName, Condi: dkWhere, ...fields } = req.body;

    // Fail fast on required inputs
    if (!tblName || !dkWhere || dkWhere === "true") {
      return res.status(400).send("Invalid request");
    }

    const checkFunc = await pool.request()
      .input("tblName", tblName)
      .query(`
        SELECT name 
        FROM sys.objects 
        WHERE type ='U' AND name = @tblName
      `);

    if (checkFunc.recordset.length === 0) {
      return res.status(400).send("Table not found");
    }
      
    const request = (await poolPromise).request();
    const updates = [];
    let paramIndex = 0;

    for (const [key, value] of Object.entries(fields)) {
      paramIndex++;
      const paramName = `param${paramIndex}`;
      updates.push(`${key} = @${paramName}`);
      request.input(paramName, value);
    }

    if (updates.length === 0) {
      return res.status(400).send("No fields to update");
    }

    const qryString = `UPDATE ${tblName} SET ${updates.join(", ")} WHERE ${dkWhere}`;
    const result = await request.query(qryString);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

export default router;