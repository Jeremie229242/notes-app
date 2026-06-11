import { getElasticsearchClient, INDICES } from "./elasticsearch";

export interface SearchDocument {
  noteId: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  indexedAt: string;
}

export interface SearchQuery {
  query?: string;
  userId: string;
  tags?: string[];
  from?: number;
  size?: number;
  sortBy?: "relevance" | "created" | "updated";
  sortOrder?: "asc" | "desc";
  // Option de recherche Avancer
  fuzzy?: boolean;
  fuzziness?: number | "AUTO";
  dateFrom?: string;
  dateTo?: string;
  createdLast?: string; // "7d", "30d", "1y", etc.
  contentLength?: "short" | "medium" | "long";
}

export interface SearchResult {
  noteId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  score: number;
  highlights?: {
    title?: string[];
    content?: string[];
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  took: number;
}

export async function indexNote(document: SearchDocument): Promise<void> {
  const client = getElasticsearchClient();

  try {
    await client.index({
      index: INDICES.NOTES,
      id: document.noteId,
      body: document,
      refresh: true, //
    });
  } catch (error) {
    console.error(`Failed to index note ${document.noteId}:`, error);
    throw error;
  }
}

export async function updateNote(
  noteId: string,
  updates: Partial<SearchDocument>
): Promise<void> {
  const client = getElasticsearchClient();

  try {
    await client.update({
      index: INDICES.NOTES,
      id: noteId,
      body: {
        doc: updates,
      },
      refresh: true,
    });
  } catch (error) {
    console.error(`Failed to update note ${noteId}:`, error);
    throw error;
  }
}

export async function deleteNote(noteId: string): Promise<void> {
  const client = getElasticsearchClient();

  try {
    await client.delete({
      index: INDICES.NOTES,
      id: noteId,
      refresh: true,
    });
  } catch (error) {
    // Si la note n'existe pas, ce n'est pas grave.
    if (error && typeof error === "object" && "meta" in error) {
      const esError = error as { meta?: { statusCode?: number } };
      if (esError.meta?.statusCode === 404) {
        console.log(`Note ${noteId} Introuvable dans l'index (déjà supprimé)`);
        return;
      }
    }
    console.error(`Erreur de suppression de note ${noteId}:`, error);
    throw error;
  }
}

// Fonction auxiliaire pour analyser les chaînes de dates relatives
function parseRelativeDate(relativeDate: string): Date {
  const now = new Date();
  const match = relativeDate.match(/^(\d+)([dwmy])$/);

  if (!match) {
    throw new Error(`Format de date relative invalide: ${relativeDate}`);
  }

  const amount = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d": // jours
      return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
    case "w": // semaines
      return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
    case "m": // mois (approximative)
      return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
    case "y": // année (approximative)
      return new Date(now.getTime() - amount * 365 * 24 * 60 * 60 * 1000);
    default:
      throw new Error(`Unité de temps non prise en charge: ${unit}`);
  }
}

// Fonction auxiliaire pour obtenir la plage de longueur du contenu
function getContentLengthRange(contentLength: string): {
  min?: number;
  max?: number;
} {
  switch (contentLength) {
    case "short":
      return { max: 500 };
    case "medium":
      return { min: 500, max: 2000 };
    case "long":
      return { min: 2000 };
    default:
      return {};
  }
}

export async function searchNotes(
  searchQuery: SearchQuery
): Promise<SearchResponse> {
  const client = getElasticsearchClient();
  const startTime = Date.now();

  try {
    const {
      query,
      userId,
      tags,
      from = 0,
      size = 20,
      sortBy = "relevance",
      sortOrder = "desc",
      fuzzy = true,
      fuzziness = "AUTO",
      dateFrom,
      dateTo,
      createdLast,
      contentLength,
    } = searchQuery;

    // executer Elasticsearch 
    const esQuery: any = {
      bool: {
        must: [{ term: { userId } }, { term: { isDeleted: false } }],
      },
    };

    // Ajouter une recherche textuelle si une requête est fournie.
    if (query && query.trim()) {
      const multiMatchQuery: any = {
        multi_match: {
          query: query.trim(),
          fields: ["title^2", "content"], // Matchs de titre Booster
          type: "best_fields",
        },
      };

      // Ajouter du flux si activé
      if (fuzzy) {
        multiMatchQuery.multi_match.fuzziness = fuzziness;
      }

      esQuery.bool.must.push(multiMatchQuery);
    }

    // Ajoutez des filtres de balises si nécessaire.
    if (tags && tags.length > 0) {
      esQuery.bool.must.push({
        terms: { tags },
      });
    }

    // Ajouter date filters
    const dateFilters: any[] = [];

    // Gérer la date relative (createdLast)
    if (createdLast) {
      try {
        const fromDate = parseRelativeDate(createdLast);
        dateFilters.push({
          range: {
            createdAt: {
              gte: fromDate.toISOString(),
            },
          },
        });
      } catch (error) {
        console.warn(`Format createdLast invalide: ${createdLast}`);
      }
    }

    // Gérer une plage de dates absolue
    if (dateFrom || dateTo) {
      const rangeFilter: any = {
        range: {
          createdAt: {},
        },
      };

      if (dateFrom) {
        rangeFilter.range.createdAt.gte = new Date(dateFrom).toISOString();
      }

      if (dateTo) {
        // Ajoutez 1 jour pour inclure la date de fin complète.
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        rangeFilter.range.createdAt.lt = endDate.toISOString();
      }

      dateFilters.push(rangeFilter);
    }

   // Ajouter un filtre de longueur de contenu via une requête de script

    // Remarque : Le filtrage de la longueur de contenu est temporairement désactivé en raison de problèmes avec le script Elasticsearch.
    // TODO: Implement content length filtering using a different approach
    if (contentLength) {
      console.log(
        `Content filtre de longueur demandé: ${contentLength} (temporairement indisponible)`
      );
      // const lengthRange = getContentLengthRange(contentLength);

// L'implémentation sera ajoutée dans une prochaine mise à jour
    }

    // Ajouter tout date filters
    if (dateFilters.length > 0) {
      esQuery.bool.must.push(...dateFilters);
    }

    // Build par configuration
    let sort: any[] = [];
    switch (sortBy) {
      case "created":
        sort = [{ createdAt: { order: sortOrder } }];
        break;
      case "updated":
        sort = [{ updatedAt: { order: sortOrder } }];
        break;
      case "relevance":
      default:
        sort =
          query && query.trim()
            ? ["_score"]
            : [{ updatedAt: { order: "desc" } }];
        break;
    }

    const searchBody: any = {
      query: esQuery,
      sort,
      from,
      size,
      highlight: {
        fields: {
          title: {},
          content: {
            fragment_size: 150,
            number_of_fragments: 3,
          },
        },
        pre_tags: ["<mark>"],
        post_tags: ["</mark>"],
      },
      _source: ["noteId", "title", "content", "tags", "createdAt", "updatedAt"],
    };

    const response = await client.search({
      index: INDICES.NOTES,
      body: searchBody,
    });

    // Gérer le format de réponse du client Elasticsearch
    const hits = response.hits?.hits || [];
    const totalHits =
      typeof response.hits?.total === "object"
        ? (response.hits.total as any).value
        : response.hits?.total || 0;
    const tookTime = response.took || 0;

    const results: SearchResult[] = hits.map((hit: any) => ({
      noteId: hit._source.noteId,
      title: hit._source.title,
      content: hit._source.content,
      tags: hit._source.tags,
      createdAt: hit._source.createdAt,
      updatedAt: hit._source.updatedAt,
      score: hit._score,
      highlights: hit.highlight,
    }));

    const total = totalHits;
    const took = tookTime;
    const pageSize = size;
    const page = Math.floor(from / size) + 1;
    const totalPages = Math.ceil(total / pageSize);

    // Analyse de la recherche de log
    await logSearchAnalytics({
      userId,
      query: query || "",
      filters: { tags },
      resultsCount: total,
      responseTime: Date.now() - startTime,
    });

    return {
      results,
      total,
      page,
      pageSize,
      totalPages,
      took,
    };
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
}

async function logSearchAnalytics(analytics: {
  userId: string;
  query: string;
  filters: any;
  resultsCount: number;
  responseTime: number;
}): Promise<void> {
  const client = getElasticsearchClient();

  try {
    await client.index({
      index: INDICES.SEARCH_ANALYTICS,
      body: {
        ...analytics,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Ne faites pas échouer la recherche si la journalisation analytique échoue.
    console.error("Échec de l'enregistrement des analyses de recherche:", error);
  }
}