import { searchNotes, indexNote, SearchDocument } from "../src/searchService";
import { getElasticsearchClient, initializeElasticsearch } from "../src/elasticsearch";

// Mock Elasticsearch client
jest.mock("../src/elasticsearch");

const mockElasticsearchClient = {
  index: jest.fn(),
  search: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  ping: jest.fn(),
  indices: {
    exists: jest.fn(),
    create: jest.fn(),
  },
  cluster: {
    health: jest.fn(),
  },
};

(getElasticsearchClient as jest.Mock).mockReturnValue(mockElasticsearchClient);

describe("Search Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("indexNote", () => {
    it("should index a note successfully", async () => {
      const mockDocument: SearchDocument = {
        noteId: "note-123",
        userId: "user-123",
        title: "Test Note",
        content: "This is a test note content",
        tags: ["test", "example"],
        isDeleted: false,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        indexedAt: "2023-01-01T00:00:00Z",
      };

      mockElasticsearchClient.index.mockResolvedValue({ body: { result: "created" } });

      await indexNote(mockDocument);

      expect(mockElasticsearchClient.index).toHaveBeenCalledWith({
        index: "notesverb_notes",
        id: "note-123",
        body: mockDocument,
        refresh: true,
      });
    });

    it("should handle indexing errors", async () => {
      const mockDocument: SearchDocument = {
        noteId: "note-123",
        userId: "user-123",
        title: "Test Note",
        content: "This is a test note content",
        tags: [],
        isDeleted: false,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        indexedAt: "2023-01-01T00:00:00Z",
      };

      mockElasticsearchClient.index.mockRejectedValue(new Error("Elasticsearch error"));

      await expect(indexNote(mockDocument)).rejects.toThrow("Elasticsearch error");
    });
  });

  describe("searchNotes", () => {
    it("should search notes successfully", async () => {
      const mockSearchResponse = {
        body: {
          hits: {
            total: { value: 1 },
            hits: [
              {
                _source: {
                  noteId: "note-123",
                  title: "Test Note",
                  content: "This is a test note content",
                  tags: ["test"],
                  createdAt: "2023-01-01T00:00:00Z",
                  updatedAt: "2023-01-01T00:00:00Z",
                },
                _score: 1.5,
                highlight: {
                  title: ["<mark>Test</mark> Note"],
                  content: ["This is a <mark>test</mark> note content"],
                },
              },
            ],
          },
          took: 5,
        },
      };

      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse);
      mockElasticsearchClient.index.mockResolvedValue({ body: { result: "created" } });

      const searchQuery = {
        query: "test",
        userId: "user-123",
        from: 0,
        size: 20,
        sortBy: "relevance" as const,
        sortOrder: "desc" as const,
      };

      const result = await searchNotes(searchQuery);

      expect(result).toEqual({
        results: [
          {
            noteId: "note-123",
            title: "Test Note",
            content: "This is a test note content",
            tags: ["test"],
            createdAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-01T00:00:00Z",
            score: 1.5,
            highlights: {
              title: ["<mark>Test</mark> Note"],
              content: ["This is a <mark>test</mark> note content"],
            },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        took: 5,
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: "notesverb_notes",
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                { term: { userId: "user-123" } },
                { term: { isDeleted: false } },
                expect.objectContaining({
                  multi_match: expect.objectContaining({
                    query: "test",
                    fields: ["title^2", "content"],
                  }),
                }),
              ]),
            }),
          }),
        }),
      });
    });

    it("should handle search with tags filter", async () => {
      const mockSearchResponse = {
        body: {
          hits: {
            total: { value: 0 },
            hits: [],
          },
          took: 2,
        },
      };

      mockElasticsearchClient.search.mockResolvedValue(mockSearchResponse);
      mockElasticsearchClient.index.mockResolvedValue({ body: { result: "created" } });

      const searchQuery = {
        query: "test",
        userId: "user-123",
        tags: ["important", "work"],
        from: 0,
        size: 20,
        sortBy: "relevance" as const,
        sortOrder: "desc" as const,
      };

      await searchNotes(searchQuery);

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: "notesverb_notes",
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                { term: { userId: "user-123" } },
                { term: { isDeleted: false } },
                { terms: { tags: ["important", "work"] } },
              ]),
            }),
          }),
        }),
      });
    });
  });
});