// routes/login.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { poolPromise } from "../dboperations.js"; // This now exports the mysql2 promise pool

dotenv.config();

const router = express.Router();

router.post("/api/login", async (req, res) => {
  const { UserName, Password } = req.body;
  let connection; // Declare connection for proper cleanup

  if (!UserName || !Password) {
    return res.status(400).json({ message: "UserName and Password required" });
  }

  try {
    connection = await poolPromise.getConnection();

    const [rows] = await connection.query(
      `SELECT Val AS UserName, objJson AS UserRight, 
        JSON_UNQUOTE(JSON_EXTRACT(objJson, '$.fid')) AS PasswordHash
       FROM Misc
       WHERE cat='UROLE' and Val = ? 
       LIMIT 1`,
      [UserName] // Pass parameter values as an array
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid UserName or Password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(Password, user.PasswordHash);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid UserName or Password' });
    }

    const token = jwt.sign(
      { UserName: user.UserName, UserRight: user.UserRight }, // Using UserRight as the role
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { UserName: user.UserName, UserRight: user.UserRight } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
