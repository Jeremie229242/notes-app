import { Request, Response } from "express";
import { asyncHandler } from "../../../partage/middleware";
import { AuthService } from "./authService";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../../../partage/utils";

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const tokens = await authService.register(email, password);

  res
    .status(201)
    .json(createSuccessResponse(tokens, "L'utilisateur s'est inscrit avec succès."));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const tokens = await authService.login(email, password);

  res
    .status(200)
    .json(createSuccessResponse(tokens, "L'utilisateur s'est connecté avec succès."));
});

export const refreshTokens = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);

    res
      .status(200)
      .json(createSuccessResponse(tokens, "Tokens refreshe avec succes"));
  }
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);

  res
    .status(200)
    .json(createSuccessResponse(null, "L'utilisateur s'est déconnecté avec succès"));
});

export const validateToken = asyncHandler(
  async (req: Request, res: Response) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json(createErrorResponse("Aucun jeton fourni"));
    }

    const payload = await authService.validateToken(token);

    res.status(200).json(createSuccessResponse(payload, "Token est valide"));
  }
);

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json(createErrorResponse("Unauthorized"));
  }

  const user = await authService.getUserById(userId);

  if (!user) {
    return res.status(404).json(createErrorResponse("User non trouvé"));
  }

  return res
    .status(200)
    .json(createSuccessResponse(user, "Profil utilisateur récupéré"));
});

export const deleteAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(createErrorResponse("Unauthorized"));
    }

    await authService.deleteUser(userId);

    return res
      .status(200)
      .json(createSuccessResponse(null, "Compte supprimé avec succès"));
  }
);