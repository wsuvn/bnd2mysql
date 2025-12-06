// middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Missing token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        // Token is expired
        return res.status(401).json({ message: "401-Token expired. Please log in again." });
      } else {
        // Invalid token
        return res.status(401).json({ message: "401-Token is invalid. Please log in." });
      }
    }
    req.user = user; // { id, username, role }
    next();
  });
} 