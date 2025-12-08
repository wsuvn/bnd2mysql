import express from "express";
import { poolPromise } from "../dboperations.js"; // Exports the mysql2 promise pool
import { authenticateToken } from "../middleware/auth.js"; // 🔹 central auth middleware

const router = express.Router();

// ===== Protected: generic single table UPDATE function (MySQL) =====
router.post("/api/singleQuery", authenticateToken, async (req, res) => {
  let connection;
  const { qryString } = req.body;
  console.log(qryString)
  if (qryString.substring(0,6).toUpperCase()!='SELECT'){return}
  try {
    connection = await poolPromise.getConnection();
    const [resultRows] = await connection.query(qryString);
    let cleanResult = [];
    
    // MySQL returns nested arrays and OkPackets — we keep only arrays of rows
    if (Array.isArray(resultRows)) {
      cleanResult = resultRows.filter(
        (item) => Array.isArray(item) && item.length > 0
      );
    }
    
    // If no resultsets, return "ok"
    if (cleanResult.length === 0) {
      return res.json({ status: "ok" });
    }
    
    return res.json(cleanResult);
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
