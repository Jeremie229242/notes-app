import { UserService } from "../src/userService";

// Mock  dependences externe
jest.mock("../src/authClient");

// Import mocked modules
import axios from "axios";
import { AuthClient } from "../src/authClient";
import { ServiceError } from "../../../partage/types";
import {
  resetAllMocks,
  testUpdateProfileRequest,
  testUserProfile,
} from "./setup";

const MockedAuthClient = AuthClient as jest.MockedClass<typeof AuthClient>;

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

describe("UserService", () => {
  let userService: UserService;
  let mockAuthClient: jest.Mocked<AuthClient>;

  beforeAll(() => {
    resetAllMocks();

    // Creer mock AuthClient instance
    mockAuthClient = {
      validateToken: jest.fn(),
    } as any;

    MockedAuthClient.mockImplementation(() => mockAuthClient);

    userService = new UserService();
  });

  describe("createProfile", () => {
    const userId = "test-user-id";
    const profileData = {
      firstName: "Test",
      lastName: "User",
      bio: "Ceci est un test profile d'utilisateur.",
      avatarUrl: "http://example.com/avatar.jpg",
      preferences: { theme: "dark", notifications: true },
    };

    it("devrait créer un profil utilisateur avec succès", async () => {
      global.mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      global.mockPrisma.userProfile.create.mockResolvedValue(testUserProfile);

      const result = await userService.createProfile(userId, profileData);
      expect(global.mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(global.mockPrisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId,
          ...profileData,
        },
      });
      expect(result).toEqual(testUserProfile);
    });

    it("devrait générer une erreur si le profil existe déjà.", async () => {
      global.mockPrisma.userProfile.findUnique.mockResolvedValue(
        testUserProfile
      );

      await expectServiceError(
        () => userService.createProfile(userId, profileData),
        "Le profil utilisateur existe déjà.",
        409
      );

      expect(global.mockPrisma.userProfile.create).not.toHaveBeenCalled();
    });

    it("Il convient de nettoyer les données saisies avant de créer un profil.", async () => {
      const unsanitizedData = {
        firstName: "<script>alert('xss')</script>Test",
        lastName: "User",
        bio: "ceci est un test profile d'utilisateur.",
        avatarUrl: "http://example.com/avatar.jpg",
        preferences: { theme: "dark", notifications: true },
      };

      global.mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      global.mockPrisma.userProfile.create.mockResolvedValue(testUserProfile);

      await userService.createProfile(userId, unsanitizedData);

      expect(global.mockPrisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId,
          firstName: "scriptalert('xss')/scriptTest",
          lastName: "User",
          bio: "ceci est un test profile d'utilisateur.",
          avatarUrl: "http://example.com/avatar.jpg",
          preferences: { theme: "dark", notifications: true },
        },
      });
    });
  });

  describe("getProfile", () => {
    const userId = "test-user-id";

    it("devrait récupérer avec succès un profil utilisateur existant", async () => {
      global.mockPrisma.userProfile.findUnique.mockResolvedValue(
        testUserProfile
      );

      const result = await userService.getProfile(userId);
      expect(global.mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual(testUserProfile);
    });

    it("devrait générer une erreur si le profil n'existe pas", async () => {
      global.mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      await expectServiceError(
        () => userService.getProfile(userId),
        "Profil utilisateur introuvable",
        404
      );
    });
  });

  describe("updateProfile", () => {
    const userId = "test-user-id";

    it("devrait mettre à jour un profil utilisateur existant avec succès", async () => {
      global.mockPrisma.userProfile.findUnique.mockResolvedValue(
        testUserProfile
      );
      global.mockPrisma.userProfile.update.mockResolvedValue({
        ...testUserProfile,
        ...testUpdateProfileRequest,
      });
    });

    it("devrait créer un profil s'il n'existe pas.", async () => {
      global.mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      global.mockPrisma.userProfile.create.mockResolvedValue(testUserProfile);

      const result = await userService.updateProfile(
        userId,
        testUpdateProfileRequest
      );
      expect(global.mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(global.mockPrisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId,
          ...testUpdateProfileRequest,
        },
      });
      expect(result).toEqual(testUserProfile);
    });
  });
});