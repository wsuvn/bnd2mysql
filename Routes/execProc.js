import express from "express";
import { poolPromise } from "../dboperations.js";
import { authenticateToken } from "../middleware/auth.js";  // 🔹 central auth middleware

const router = express.Router();

// ===== Protected: generic SELECT function =====
router.put("/api/execProc", authenticateToken, async (req, res) => {
  try {
    const { procName, ...params } = req.body;

    // Validate input early
    if (!procName) {
      return res.status(400).send("Procedure name required");
    }

    const checkFunc = await pool.request()
      .input("procName", procName)
      .query(`
        SELECT name 
        FROM sys.objects 
        WHERE type ='P' AND name = @procName
      `);

    if (checkFunc.recordset.length === 0) {
      return res.status(400).send("Proc not found");
    }
      
    const request = (await poolPromise).request();

    // Bind parameters dynamically
    let paramIndex = 0;
    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith("para")) {
        paramIndex++;
        request.input(`param${paramIndex}`, value);
      }
    }

    // Build exec string with parameter placeholders
    const placeholders = Object.keys(params)
      .filter((k) => k.startsWith("para"))
      .map((_, i) => `@param${i + 1}`)
      .join(", ");

    const qryString = `EXEC ${procName} ${placeholders}`;
    const result = await request.query(qryString);

    res.json(result.recordsets);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


export default router;