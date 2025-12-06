// routes/login.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { poolPromise } from "../dboperations.js";


dotenv.config();

const router = express.Router();

router.post("/api/login", async (req, res) => {
  const { UserName, Password } = req.body;

  if (!UserName || !Password) {
    return res.status(400).json({ message: "UserName and Password required" });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('UserName', UserName) // mssql will infer NVARCHAR
      .query(`SELECT TOP 1 UserName, SavedPSW, UserRight FROM tblUser WHERE UserName = @UserName`);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid UserName or Password' });
    }

    const user = result.recordset[0];
    // Compare the Password with bcrypt
    const isMatch = await bcrypt.compare(Password, user.SavedPSW);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid UserName or Password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.UserID, UserName: user.UserName, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { UserName: user.UserName, UserRight: user.UserRight } });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;