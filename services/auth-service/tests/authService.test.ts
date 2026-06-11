import { AuthService } from "../src/authService";

// Simuler les dépendances externes
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

// import mocked modules
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  resetAllMocks,
  testJwtPayload,
  testRefreshToken,
  testUser,
} from "./setup";
import { ServiceError } from "../../../partage/types";

const mockedUuidv4 = uuidv4 as unknown as jest.Mock<string, []>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Fonction auxiliaire pour tester ServiceError
async function expectServiceError(
  asyncFn: () => Promise<any>,
  expectedMessage: string,
  expectedStatusCode: number
) {
  try {
    await asyncFn();
    fail("Fonction attendue pour lever une erreur de service");
  } catch (error) {
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.message).toBe(expectedMessage);
    expect(error.statusCode).toBe(expectedStatusCode);
  }
}

describe("AuthService", () => {
  let authService: AuthService;

  beforeAll(() => {
    resetAllMocks();
    authService = new AuthService();

    // setup par defaut mock implementations
    mockedUuidv4.mockReturnValue("test-uuid");
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockedJwt.sign as jest.Mock).mockReturnValue("test-jwt-token");
    (mockedJwt.verify as jest.Mock).mockReturnValue(testJwtPayload);
  });

  describe("constructor", () => {
    it("devrait s'initialiser avec des variables d'environnement", () => {
      expect(authService).toBeInstanceOf(AuthService);
    });

    it("devrait générer une erreur si JWT_SECRET n'est pas configuré", () => {
      delete process.env.JWT_SECRET;
      expect(() => new AuthService()).toThrow(
        "Les JWT secrets ne sont pas définies dans les variables d'environnement"
      );
      process.env.JWT_SECRET = "test-jwt-secret-key"; // Réinitialiser pour d'autres tests
    });

    it("devrait générer une erreur si JWT_REFRESH_SECRET n'est pas configurer", () => {
      delete process.env.JWT_REFRESH_SECRET;
      expect(() => new AuthService()).toThrow(
        "Les JWT secrets ne sont pas définies dans les variables d'environnement"
      );
      process.env.JWT_REFRESH_SECRET =
        "test-jwt-refresh-secret-key";
    });
  });

  describe("register", () => {
    const email = "sigmmmmma@user.com";
    const password = "testpassword";

    it("devrait réussir l'enregistrement d'un nouvel utilisateur", async () => {
      // setup mocks
      global.mockPrisma.user.findUnique.mockResolvedValue(null);
      global.mockPrisma.user.create.mockResolvedValue(testUser);
      global.mockPrisma.refreshToken.create.mockResolvedValue(testRefreshToken);

      const result = await authService.register(email, password);

      expect(global.mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 4);
      expect(global.mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email,
          password: "hashed-password",
        },
      });
      expect(result).toEqual({
        accessToken: "test-jwt-token",
        refreshToken: "test-jwt-token",
      });
    });

    it("devrait générer une erreur si l'utilisateur existe déjà", async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue(testUser);

      await expectServiceError(
        () => authService.register(email, password),
        "Utilisateur existe deja",
        409
      );

      expect(global.mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("devrait gérer les erreurs de base de données lors de la création", async () => {
        global.mockPrisma.user.findUnique.mockResolvedValue(null);
        global.mockPrisma.user.create.mockRejectedValue(new Error("Erreur de base de données"));
    
        await expect(authService.register(email, password)).rejects.toThrow("Erreur de base de données");
    })
  });
});