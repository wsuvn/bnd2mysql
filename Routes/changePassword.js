// routes/changePassword.js
import express from "express";
import bcrypt from "bcrypt";
import { poolPromise } from "../dboperations.js"; // Exports the mysql2 promise pool
import { authenticateToken } from "../middleware/auth.js"; 
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);

router.post("/api/changepassword", authenticateToken, async (req, res) => {
  const { newPassword } = req.body; 
  let connection;

  if (isNaN(SALT_ROUNDS)) {
      console.error("BCRYPT_SALT_ROUNDS environment variable is missing or invalid.");
      return res.status(500).json({ message: "Server configuration error." });
  }

  try {
    connection = await poolPromise.getConnection();
    const UserName = req.user.UserName; // Username is injected by authenticateToken middleware

    const [rows] = await connection.query(
      `SELECT Val AS UserName
       FROM Misc
       WHERE cat='UROLE' and Val = ? 
       LIMIT 1`,
      [UserName] // Pass parameter values as an array
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const user = rows[0];

    const isMatch = await bcrypt.compare(oldPassword, user.SavedPSW);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const [result] = await connection.query(
      `UPDATE Misc 
      SET objJson = JSON_SET(objJson, '$.fid', ?)
      where cat='UROLE' and Val = ? `,
      [newHash, UserName] 
    );
    
    if (result.affectedRows === 0) {
        return res.status(500).json({ message: "Password update failed. User not found or no change made." });
    }

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
