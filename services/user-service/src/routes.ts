import { authenticateToken, validateRequest } from "../../../partage/middleware";
import * as userController from "./userController";
import { Router } from "express";
import { updateProfileSchema } from "./validation";

const router = Router();

// Routes protégées (nécessite une authentification)
router.get("/profile", authenticateToken, userController.getProfile);
router.put("/profile", authenticateToken, validateRequest(updateProfileSchema), userController.updateProfile);
router.delete("/profile", authenticateToken, userController.deleteProfile);

export default router;