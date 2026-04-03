import express from "express";
import path from "path";
import http from "http";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./server/db.ts";
import apiRoutes from "./server/routes.ts";
import { initBroadcaster } from "./server/broadcaster.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Connect to MongoDB
  await connectDB();

  // Initialize WebSocket broadcaster
  initBroadcaster(server);

  app.use(cors());
  app.use(cookieParser());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes
  app.use("/api", (req, res, next) => {
    console.log(`API Request: ${req.method} ${req.url}`);
    apiRoutes(req, res, next);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.join(process.cwd(), "frontend"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "frontend/dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.path}` });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
