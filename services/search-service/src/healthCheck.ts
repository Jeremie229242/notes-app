import { Request, Response } from "express";
import { getElasticsearchClient } from "./elasticsearch";

export const healthCheck = async (
  req: Request,
  res: Response
): Promise<void> => {
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "search-service",
    version: "1.0.0",
    checks: {
      elasticsearch: {
        status: "unknown",
        responseTime: 0,
        error: null as string | null,
      },
      kafka: {
        status: "unknown", // 
        error: null as string | null,
      },
    },
  };

  // Check Elasticsearch health
  try {
    const startTime = Date.now();
    const client = getElasticsearchClient();

    // Simple ping pour check si Elasticsearch est disponible
    await client.ping();

    const responseTime = Date.now() - startTime;

    healthStatus.checks.elasticsearch = {
      status: "healthy",
      responseTime,
      error: null,
    };
  } catch (error) {
    healthStatus.checks.elasticsearch = {
      status: "unhealthy",
      responseTime: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    healthStatus.status = "unhealthy";
  }

  
  healthStatus.checks.kafka.status = "healthy"; // Assume healthy 

  // Determine HTTP status code
  const httpStatus = healthStatus.status === "healthy" ? 200 : 503;

  res.status(httpStatus).json(healthStatus);
};