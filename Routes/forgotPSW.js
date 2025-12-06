// routes/changePassword.js
import express from "express";
import bcrypt from "bcrypt";
import { poolPromise } from "../dboperations.js";
import crypto from "crypto";

const router = express.Router();
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS);

router.post("/api/forgotpassword", async (req, res) => {
  try {
    const pool = await poolPromise;

    // Get current stored hash
    const result = await pool.request()
      .input("UserName", req.body.UserName)
      .query(`SELECT top 1 Cat from tblUser where UserName = @UserName`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const tempPassword = crypto.randomBytes(6).toString("hex"); // e.g. "a1b2c3d4e5f6"
    const tempHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);


    // Update DB
    await pool.request()
      .input("UserName", req.body.UserName)
      .input("tempHash", tempHash)
      .query(`UPDATE tblUser set SavedPSW = @tempHash WHERE UserName = @UserName`);

    res.json({ message: "OK", NewPSW: tempPassword});
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Error. Internal server error" });
  }
});

export default router;