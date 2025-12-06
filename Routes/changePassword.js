// routes/changePassword.js
import express from "express";
import bcrypt from "bcrypt";
import { poolPromise } from "../dboperations.js";
import { authenticateToken } from "../middleware/auth.js"; // 🔥 need to create this


const router = express.Router();
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS);

router.post("/api/changepassword", authenticateToken, async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "Both old and new password required" });
  }

  try {
    const pool = await poolPromise;
    // Hash new password
    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    // Update DB
    await pool.request()
      .input("UserName", req.user.UserName)
      .input("newHash", newHash)
      .query(`UPDATE tblUser set SavedPSW = @newHash WHERE UserName = @UserName`);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;