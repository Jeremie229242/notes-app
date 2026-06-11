import { Request, Response } from "express";
import { searchNotes, SearchQuery } from "./searchService";

// Étendre le type de requête pour inclure l'utilisateur du middleware JWT
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const search = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    const {
      q: query,
      tags,
      page = 1,
      size = 20,
      sortBy = "relevance",
      sortOrder = "desc",
      fuzzy = true,
      fuzziness = "AUTO",
      dateFrom,
      dateTo,
      createdLast,
      contentLength,
    } = req.query;

    // Valider et analyser les paramètres
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(size as string) || 20)); // Max 100 resultats par page
    const from = (pageNum - 1) * pageSize;

    // Analyser les tags si elles sont fournies
    let tagArray: string[] = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagArray = tags as string[];
      } else if (typeof tags === "string") {
        tagArray = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
    }

    const searchQuery: SearchQuery = {
      query: query as string,
      userId,
      tags: tagArray.length > 0 ? tagArray : undefined,
      from,
      size: pageSize,
      sortBy: sortBy as "relevance" | "created" | "updated",
      sortOrder: sortOrder as "asc" | "desc",
      // Parametre de recherche avancer
      fuzzy: fuzzy === "true" || fuzzy === true,
      fuzziness:
        fuzziness === "AUTO" ? "AUTO" : parseInt(fuzziness as string) || "AUTO",
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      createdLast: createdLast as string,
      contentLength: contentLength as "short" | "medium" | "long",
    };

    const searchResponse = await searchNotes(searchQuery);

    res.json({
      success: true,
      data: searchResponse,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur lors de la recherche",
    });
  }
};

export const searchSuggestions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    const { q: query } = req.query;

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      res.json({
        success: true,
        data: {
          suggestions: [],
        },
      });
      return;
    }

    // Pour l'instant, renvoyer des suggestions simples basées sur la recherche.

// À l'avenir, cette fonctionnalité pourrait être améliorée avec la saisie semi-automatique.
    const searchQuery: SearchQuery = {
      query: query as string,
      userId,
      from: 0,
      size: 5,
      sortBy: "relevance",
    };

    const searchResponse = await searchNotes(searchQuery);

    const suggestions = searchResponse.results.map((result) => ({
      text: result.title,
      type: "note",
      noteId: result.noteId,
    }));

    res.json({
      success: true,
      data: {
        suggestions,
      },
    });
  } catch (error) {
    console.error("Erreur dans les suggestions de recherche:", error);
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur lors de la recherche de suggestions",
    });
  }
};