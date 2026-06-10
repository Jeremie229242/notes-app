import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createErrorResponse } from "../../../partage/utils";

// Étendre l'interface Express Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Routes publiques ne nécessitant pas d'authentification
 */
const publicRoutes = [
  "/health",
  "/status",
  "/",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
];

/**
 * Vérifier si une route est publique (ne nécessite pas d'authentification)
 */
export function isPublicRoute(path: string): boolean {
  return publicRoutes.some((route) => {
    if (route.endsWith("*")) {
      return path.startsWith(route.slice(0, -1));
    }
    return path === route || path.startsWith(route + "/");
  });
}

/**
 * Middleware d'authentification JWT pour passerelle API
 */
export function gatewayAuth(req: Request, res: Response, next: NextFunction) {
  // Ignorer l'authentification pour les routes publiques
  if (isPublicRoute(req.path)) {
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(createErrorResponse("Jeton d'accès requis"));
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET non configuré dans API Gateway");
    return res
      .status(500)
      .json(createErrorResponse("Erreur de configuration du serveur"));
  }

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      return res
        .status(403)
        .json(createErrorResponse("Jeton invalide ou expiré"));
    }

    // Ajouter les informations utilisateur à la demande de transfert vers les services
    req.user = decoded;

    // Ajouter les informations utilisateur aux en-têtes pour la communication de service
    req.headers["x-user-id"] = decoded.userId;
    req.headers["x-user-email"] = decoded.email;

    next();
  });
}

/**
 * Intergiciel d'authentification optionnel
* Ajoute l'utilisateur à la requête si le jeton est valide, mais ne l'exige pas.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next();
  }

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (!err) {
      req.user = decoded;
      req.headers["x-user-id"] = decoded.userId;
      req.headers["x-user-email"] = decoded.email;
    }
    next();
  });
}