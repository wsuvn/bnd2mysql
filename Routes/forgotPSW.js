// routes/changePassword.js
import express from "express";
import bcrypt from "bcrypt";
import { poolPromise } from "../dboperations.js"; // Exports the mysql2 promise pool
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
// Ensure BCRYPT_SALT_ROUNDS is available and parsed correctly
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);

router.post("/api/forgotpassword", async (req, res) => {
  const { UserName } = req.body;
  let connection; // Declare connection for proper cleanup

  if (!UserName) {
    return res.status(400).json({ message: "UserName is required" });
  }
  if (isNaN(SALT_ROUNDS)) {
      console.error("BCRYPT_SALT_ROUNDS environment variable is missing or invalid.");
      return res.status(500).json({ message: "Server configuration error." });
  }

  try {
    
    connection = await poolPromise.getConnection();
    
    const [userRows] = await connection.query(
      `SELECT Val AS UserName
       FROM Misc
       WHERE cat='UROLE' and Val = ? 
       LIMIT 1`,
      [UserName] // Pass parameter values as an array
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const tempPassword = crypto.randomBytes(6).toString("hex"); // e.g. "a1b2c3d4e5f6"
    const tempHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);


    await connection.query(
      `UPDATE Misc 
      SET objJson = JSON_SET(objJson, '$.fid', ?)
      where cat='UROLE' and Val = ? `,
      [tempHash, UserName] // Bind parameters in order: [value for SavedPSW, value for UserName]
    );

    res.json({ message: "Password reset successful. Temporary password provided.", NewPSW: tempPassword});
    
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
