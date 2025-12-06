import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import loginRouter from "./Routes/login.js";
import changePasswordRouter from "./Routes/changePassword.js";
import forgotPasswordRouter from "./Routes/forgotPSW.js";
import SelectData from "./Routes/selectData.js";
import execProc from "./Routes/execProc.js";
import updateSingleTable from "./Routes/updateTable.js";

dotenv.config();

const app = express();
app.use(express.json());

// ===== CORS =====
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ===== Mount routes =====

app.use(loginRouter);
app.use(changePasswordRouter);
app.use(forgotPasswordRouter);
app.use(SelectData);
app.use(execProc);
app.use(updateSingleTable);

// ===== Start server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});