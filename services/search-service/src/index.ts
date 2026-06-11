import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import searchRoutes from "./routes";
import { corsOptions, errorHandler } from "../../../partage/middleware";

import { initializeElasticsearch } from "./elasticsearch";
import { healthCheck } from "./healthCheck";

//load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

// setup middlewares
app.use(cors(corsOptions()));
app.use(helmet());

// parse JSON bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/search", searchRoutes);
app.get("/health", healthCheck);

// Error handling middleware
app.use(errorHandler);

const server = app.listen(PORT, async () => {
  console.log(`🔍 Search service is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Search API: http://localhost:${PORT}/search`);
  console.log("");

  // Initialize Elasticsearch
  try {
    await initializeElasticsearch();
    console.log("✅ Elasticsearch initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Elasticsearch:", error);
  }

 
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("🚦 Shutting down Search Service...");

  

  server.close(() => {
    console.log("✅ Search Service shut down gracefully");
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown();
});