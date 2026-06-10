import { Request, Response, NextFunction } from "express";
import { JWTPayload, logError, ServiceError } from "../types";
import { createErrorResponse } from "../utils";
import jwt from "jsonwebtoken";

// étend l'interface de requête express pour inclure des propriétés personnalisées
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function authenticateToken (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer token

  if (!token) {
    return res.status(401).json(createErrorResponse("Jeton d'accès requis"));
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logError(new Error("JWT_SECRET non definis"));
    return res.status(500).json(createErrorResponse("Erreur interne du serveur"));
  }

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json(createErrorResponse("Invalide token"));
    }

    req.user = decoded as JWTPayload; // Joindre les informations de l'utilisateur à la demande
    next();
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function validateRequest(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
      const errors: Record<string, string[]> = {};
      error.details.forEach((detail: any) => {
        const field = detail.path.join(".");
        if (!error[field]) {
          errors[field] = [];
        }
        errors[field].push(detail.message);
      });

      return res.status(400).json({
        success: false,
        message: "erreur de Validation",
        errors,
      });
    }

    next();
  };
}

export function errorHandler(
  error: ServiceError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logError(error, {
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  const statusCode = error.statusCode || 500;
  const message = error.message || " Erreur interne du server";

  res.status(statusCode).json(createErrorResponse(message));

  next();
}

export function corsOptions() {
  return {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: process.env.CORS_CREDENTIALS === "true",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}

export function healthCheck(req: Request, res: Response) {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
}