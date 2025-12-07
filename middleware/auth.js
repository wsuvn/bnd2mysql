// middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function authenticateToken(req, res, next) {
  console.log("🔥 AUTH MIDDLEWARE HIT");
  console.log("Headers:", req.headers);

  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    console.log("❌ Missing Authorization header");
    return res.status(401).json({ message: "Missing token" });
  }

  const token = authHeader.split(" ")[1];
  console.log("🔑 Extracted token:", token);

  if (!token) {
    console.log("❌ No token after Bearer");
    return res.status(401).json({ message: "Missing token" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ Token verify error:", err);

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "401-Token expired. Please log in again." });
      } else {
        return res.status(401).json({ message: "401-Token is invalid. Please log in." });
      }
    }

    console.log("✅ Token validated:", user);
    req.user = user;
    next();
  });
}
