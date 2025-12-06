import express from "express";
import { poolPromise } from "../dboperations.js";
import { authenticateToken } from "../middleware/auth.js";  // 🔹 central auth middleware

const router = express.Router();

// ===== Protected: generic SELECT function =====
router.get("/api/SelectData", authenticateToken, async (req, res) => {
  try {
    const { funcName, orderBy, ...params } = req.query;
    if (!funcName) return res.status(400).send("Function name required");

    const pool = await poolPromise;

    // ✅ Validate function exists in DB
    const checkFunc = await pool.request()
      .input("funcName", funcName)
      .query(`
        SELECT name 
        FROM sys.objects 
        WHERE type IN ('FN','IF','TF') AND name = @funcName
      `);

    if (checkFunc.recordset.length === 0) {
      return res.status(400).send("Function not found");
    }

    const request = pool.request();
    let paramIndex = 0;
    const placeholders = [];

    // add parameters dynamically
    for (const [_, value] of Object.entries(params)) {
      paramIndex++;
      const paramName = `param${paramIndex}`;
      request.input(paramName, value);
      placeholders.push(`@${paramName}`);
    }

    let qryString = `SELECT * FROM ${funcName}(${placeholders.join(", ")})`;

    if (orderBy) {
      // ❗ ensure orderBy is safe — right now it’s raw SQL
      qryString += ` ORDER BY ${orderBy}`;
    }

    const result = await request.query(qryString);
    res.json(result.recordset);

  } catch (err) {
    res.status(500).send("Database error");
  }
});

export default router;