import { Router } from "express";
import * as authController from "./authController";
import { authenticateToken, validateRequest } from "../../../partage/middleware";
import { loginSchema, refreshTokenSchema, registerSchema } from "./validation";

const router = Router();

//public routes
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register
);

router.post("/login", validateRequest(loginSchema), authController.login);

router.post(
  "/refresh",
  validateRequest(refreshTokenSchema),
  authController.refreshTokens
);

router.post(
  "/logout",
  validateRequest(refreshTokenSchema),
  authController.logout
);

// Point de terminaison de validation des tokens (pour que d'autres services puissent valider les tokens)
router.post("/validate", authController.validateToken);

// Proteger routes
router.get("/profile", authenticateToken, authController.getProfile);
router.delete("/profile", authenticateToken, authController.deleteAccount);

export default router;