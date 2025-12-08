import express from "express";
import { poolPromise } from "../dboperations.js"; // Exports the mysql2 promise pool
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

// ===== Protected: generic single table UPDATE function (MySQL) =====
router.post("/api/singleQuery", authenticateToken, async (req, res) => {
  let connection;  // you need this

  try {
    const { qryString } = req.body;

    if (!qryString || typeof qryString !== "string") {
      return res.status(400).json({ message: "Missing qryString" });
    }

    if (!qryString.trim().toUpperCase().startsWith("SELECT")) {
      return res.status(403).json({ message: "Only SELECT queries allowed" });
    }
    connection = await poolPromise.getConnection();
    const [rows] = await connection.query(qryString);
    
    const parsedRows = rows.map(r => {
      return Object.fromEntries(
        Object.entries(r).map(([key, val]) => [key, safeParseJSON(val)])
      );
    });

    return res.json(parsedRows);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
