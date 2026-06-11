import { Client } from "@elastic/elasticsearch";

let esClient: Client | null = null;

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const INDEX_PREFIX = process.env.ELASTICSEARCH_INDEX_PREFIX || "notesverb";

// Index names
export const INDICES = {
  NOTES: `${INDEX_PREFIX}_notes`,
  SEARCH_ANALYTICS: `${INDEX_PREFIX}_search_analytics`,
} as const;

export function getElasticsearchClient(): Client {
  if (!esClient) {
    esClient = new Client({
      node: ELASTICSEARCH_URL,
      auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD 
        ? {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD,
          }
        : undefined,
      requestTimeout: 30000,
      pingTimeout: 3000,
      maxRetries: 3,
    });
  }
  return esClient;
}

export async function initializeElasticsearch(): Promise<void> {
  const client = getElasticsearchClient();

  try {
    // Check if Elasticsearch is available
    await client.ping();
    console.log("✅ Connected to Elasticsearch");

    // Create notes index if it doesn't exist
    await createNotesIndex();
    
    // Create search analytics index if it doesn't exist
    await createSearchAnalyticsIndex();

  } catch (error) {
    console.error("❌ Failed to connect to Elasticsearch:", error);
    throw error;
  }
}

async function createNotesIndex(): Promise<void> {
  const client = getElasticsearchClient();

  try {
    const indexExists = await client.indices.exists({ index: INDICES.NOTES });
    
    if (!indexExists) {
      await client.indices.create({
        index: INDICES.NOTES,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                note_analyzer: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: ["lowercase", "stop", "snowball"]
                }
              }
            }
          },
          mappings: {
            properties: {
              noteId: { type: "keyword" },
              userId: { type: "keyword" },
              title: { 
                type: "text", 
                analyzer: "note_analyzer",
                fields: {
                  keyword: { type: "keyword" }
                }
              },
              content: { 
                type: "text", 
                analyzer: "note_analyzer" 
              },
              tags: { 
                type: "keyword" 
              },
              isDeleted: { type: "boolean" },
              createdAt: { type: "date" },
              updatedAt: { type: "date" },
              indexedAt: { type: "date" }
            }
          }
        }
      });
      console.log(`✅ Created index: ${INDICES.NOTES}`);
    } else {
      console.log(`ℹ️  Index already exists: ${INDICES.NOTES}`);
    }
  } catch (error) {
    console.error(`❌ Failed to create notes index:`, error);
    throw error;
  }
}

async function createSearchAnalyticsIndex(): Promise<void> {
  const client = getElasticsearchClient();

  try {
    const indexExists = await client.indices.exists({ index: INDICES.SEARCH_ANALYTICS });
    
    if (!indexExists) {
      await client.indices.create({
        index: INDICES.SEARCH_ANALYTICS,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          },
          mappings: {
            properties: {
              userId: { type: "keyword" },
              query: { type: "text" },
              filters: { type: "object" },
              resultsCount: { type: "integer" },
              timestamp: { type: "date" },
              responseTime: { type: "integer" }
            }
          }
        }
      });
      console.log(`✅ Created index: ${INDICES.SEARCH_ANALYTICS}`);
    } else {
      console.log(`ℹ️  Index already exists: ${INDICES.SEARCH_ANALYTICS}`);
    }
  } catch (error) {
    console.error(`❌ Failed to create search analytics index:`, error);
    throw error;
  }
}

export async function closeElasticsearchConnection(): Promise<void> {
  if (esClient) {
    await esClient.close();
    esClient = null;
    console.log("✅ Elasticsearch connection closed");
  }
}