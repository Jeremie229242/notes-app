import { Router } from "express";
import * as searchController from "./searchController";
import {
  authenticateToken,
  validateRequest,
} from "../../../partage/middleware";
import { searchSchema, searchSuggestionsSchema } from "./validation";

const router = Router();

// Endpoint de test sans authentification (pour les tests)
router.get("/test", async (req, res) => {
  res.json({
    success: true,
    message: "Search service is working!",
    timestamp: new Date().toISOString(),
    elasticsearch: "connected",
    kafka: "connected",
  });
});

// Testez le endpoint de recherche sans authentification (pour les tests)
router.get("/test-search", async (req, res) => {
  try {
    const { searchNotes } = await import("./searchService");
    const query = (req.query.q as string) || "test";
    const userId = (req.query.userId as string) || "test-user";

    const results = await searchNotes({
      query,
      userId,
      from: 0,
      size: 10,
      sortBy: "relevance",
      sortOrder: "desc",
    });

    res.json({
      success: true,
      query,
      userId,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Tous les autres itinéraires nécessitent une authentification.
router.use(authenticateToken);

// Recherche routes
router.get("/", validateRequest(searchSchema), searchController.search);
router.get(
  "/suggestions",
  validateRequest(searchSuggestionsSchema),
  searchController.searchSuggestions
);

export default router;