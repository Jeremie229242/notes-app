import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import proxyRoutes from "./routes/proxy";
import { gatewayAuth } from "./middleware/auth";
import { createErrorResponse } from "../../partage/utils";

//charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// proxy de confiance (important pour les proxys inverses)
app.set("trust proxy", 1);

// setup middlewares
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: process.env.CORS_CREDENTIALS === "true",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "x-user-email",
    ],
  })
);
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// parse JSON bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// auth middlware
app.use(gatewayAuth);

// setup proxy routes
app.use(proxyRoutes);

//Gloval error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.log("Unhandled eeror:", error);

    if (!res.headersSent) {
      res
        .status(error.statusCode || 500)
        .json(createErrorResponse(error.message || "Internal eror"));
    }
  }
);

// Demarrer le server
const server = app.listen(PORT, () => {
  console.log(`🚀 API Gateway en cour d'execution ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Gateway URL: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log("");
  console.log("📋  endpoints disponibles:");
  console.log(`   Auth Service:  http://localhost:${PORT}/api/auth/*`);
  console.log(`   User Service:  http://localhost:${PORT}/api/users/*`);
  console.log(`   Notes Service: http://localhost:${PORT}/api/notes/*`);
  console.log(`   Tags Service:  http://localhost:${PORT}/api/tags/*`);
  console.log("");
});

// Arrêt en douceur du server
process.on("SIGINT", () => {
  console.log("🚦 arret du API Gateway...");
  server.close(() => {
    console.log("✅ API Gateway s'est arreter en douceur.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("🚦 Arret du API Gateway...");
  server.close(() => {
    console.log("✅ API Gateway s'est arreter en douceur.");
    process.exit(0);
  });
});

export default app;