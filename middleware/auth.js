// middleware/auth.js
const jwt = require("jsonwebtoken");


const JWT_SECRET = process.env.JWT_SECRET || "skillforge_jwt";


function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });


  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid auth header" });
  }


  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, email, name }
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}


function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}


module.exports = { authMiddleware, requireAdmin };
middleware/auth.js