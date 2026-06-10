import { JWTPayload, ServiceResponse } from "../../../partage/types";
import { createServiceError } from "../../../partage/utils";
import axios from "axios";

export class AuthClient {
  private readonly authServiceUrl: string;

  constructor() {
    this.authServiceUrl =
      process.env.AUTH_SERVICE_URL || "http://localhost:3001";
  }

  async validateToken(token: string): Promise<JWTPayload> {
    try {
      const response = await axios.post<ServiceResponse<JWTPayload>>(
        `${this.authServiceUrl}/auth/validate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );

      if (!response.data.success || !response.data.data) {
        throw createServiceError(
          "Réponse de token invalide du service d'authentification",
          401
        );
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw createServiceError(" token expiré ou in valide", 401);
      }
      if (error.code === "ECONNRREFUSED") {
        throw createServiceError("Le service d'authentification est indisponible.", 503);
      }
      throw createServiceError("Une erreur inattendue s'est produite.", 500);
    }
  }
}