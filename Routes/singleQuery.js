import express from "express";
import { poolPromise } from "../dboperations.js"; // Exports the mysql2 promise pool
import { authenticateToken } from "../middleware/auth.js"; // 🔹 central auth middleware

const router = express.Router();

// ===== Protected: generic single table UPDATE function (MySQL) =====
router.post("/api/singleQuery", authenticateToken, async (req, res) => {
  let connection;
  try {
    const { qryString } = req.body;
    connection = await poolPromise.getConnection();
    const [resultRows] = await connection.query(qryString);
    const finalResultSets = resultRows.filter(Array.isArray);
    res.json(finalResultSets);
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
