import { Request, Response } from "express";
import { asyncHandler } from "../../../partage/middleware";
import { NotesService } from "./notesService";
import {
  createErrorResponse,
  createSuccessResponse,
  parseEnvInt,
} from "../../../partage/utils";

const noteService = new NotesService();

export const createNote = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json(createErrorResponse("Unauthorized"));
  }

  // Extraire le token JWT de l'authentification
  const authHeader = req.headers.authorization;
  const authToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  const note = await noteService.createNote(userId, req.body, authToken);

  return res
    .status(201)
    .json(createSuccessResponse(note, "Note créée avec succès"));
});

export const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json(createErrorResponse("Unauthorized"));
  }

  const page = parseEnvInt(req.query.page as string, 1);
  const limit = parseEnvInt(req.query.limit as string, 50);
  const search = req.query.search as string;

  const result = await noteService.getNotesByUser(userId, page, limit, search);

  return res
    .status(200)
    .json(createSuccessResponse(result, "Notes récupérées avec succès"));
});

export const getNoteById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { noteId } = req.params;

  if (!userId) {
    return res.status(401).json(createErrorResponse("Unauthorized"));
  }

  const note = await noteService.getNoteById(noteId, userId);

  return res
    .status(200)
    .json(createSuccessResponse(note, "Note récupérée avec succès"));
});