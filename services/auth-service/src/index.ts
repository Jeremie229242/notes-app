import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes";
import {
  corsOptions,
  errorHandler,
  healthCheck,
} from "../../../partage/middleware";

//Charger les variables d'environments 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// setup middlewares
app.use(cors(corsOptions()));
app.use(helmet());

// parse JSON bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/auth", authRoutes);
app.get("/health", healthCheck);

// Middleware de gestion des erreurs
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Auth service en cour d'execution sur le port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;