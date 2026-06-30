import "dotenv/config";
import "express-async-errors";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { pool } from "./config/database.js";
import setupPassport from "./config/passport.js";
import logger from "./utils/logger.js";

import { apiLimiter } from "./middleware/rateLimiter.middleware.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

// ─── Feature Routers ─────────────────────────────────────────────────────────
import authRoutes from "./features/auth/auth.routes.js";
import hrRoutes from "./features/hr/hr.routes.js";
import employeeRoutes from "./features/employees/employee.routes.js";
import profileRoutes from "./features/profile/profile.routes.js";

// __dirname replacement for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  const logStream = {
    write: (msg) => logger.info(msg.trim()),
  };

  app.use(morgan("combined", { stream: logStream }));
}

// ─── Passport (OAuth) ────────────────────────────────────────────────────────
setupPassport(app);

// ─── Static File Serving ─────────────────────────────────────────────────────
const uploadPath = path.resolve(process.env.UPLOAD_PATH || "./uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const logsPath = path.join(process.cwd(), "logs");

if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadPath));

// ─── API Rate Limiting ───────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/profile", profileRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    if (process.env.DATABASE_URL || process.env.PGHOST) {
      await pool.connect();
      logger.info("Database connection established");
    } else {
      logger.warn(
        "DATABASE_URL is not set. Starting without a database connection check.",
      );
    }

    app.listen(PORT, () => {
      logger.info(
        ` Basma API running on port ${PORT} [${process.env.NODE_ENV}]`,
      );
      logger.info(` Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();

export default app;
