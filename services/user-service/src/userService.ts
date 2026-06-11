import { UpdateProfileRequest, UserProfile } from "../../../partage/types";
import { AuthClient } from "./authClient";
import prisma from "./database";
import { createServiceError, sanitizeInput } from "../../../partage/utils";

export class UserService {
  private authClient: AuthClient;

  constructor() {
    this.authClient = new AuthClient();
  }

  async createProfile(
    userId: string,
    profileData: Partial<UpdateProfileRequest>
  ): Promise<UserProfile> {
    // check si le profile  existe deja
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw createServiceError("Le profil utilisateur existe déjà.", 409);
    }

    // assainir les données d'entrée
    const sanitizedData = this.sanitizeProfileData(profileData);

    // creer nouvel profile
    const profile = await prisma.userProfile.create({
      data: {
        userId,
        ...sanitizedData,
      },
    });

    return profile;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw createServiceError("Profil utilisateur introuvable", 404);
    }

    return profile;
  }

  async updateProfile(
    userId: string,
    profileData: Partial<UpdateProfileRequest>
  ): Promise<UserProfile> {
    // check si le profile existe
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      // si profile n'existe pas, crés en un
      return this.createProfile(userId, profileData);
    }

    // assainir les données d'entrée
    const sanitizedData = this.sanitizeProfileData(profileData);

    // mettre à jour le profil existant
    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: sanitizedData,
    });

    return updatedProfile;
  }

  async deleteProfile(userId: string): Promise<void> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw createServiceError("Profil utilisateur introuvable", 404);
    }

    await prisma.userProfile.delete({
      where: { userId },
    });
  }

  private sanitizeProfileData(
    data: Partial<UpdateProfileRequest>
  ): Partial<UpdateProfileRequest> {
    const sanitized: any = {};

    if (data.firstName !== undefined) {
      sanitized.firstName = data.firstName
        ? sanitizeInput(data.firstName)
        : null;
    }

    if (data.lastName !== undefined) {
      sanitized.lastName = data.lastName ? sanitizeInput(data.lastName) : null;
    }

    if (data.bio !== undefined) {
      sanitized.bio = data.bio ? sanitizeInput(data.bio) : null;
    }

    if (data.avatarUrl !== undefined) {
      sanitized.avatarUrl = data.avatarUrl
        ? sanitizeInput(data.avatarUrl)
        : null;
    }

    if (data.preferences !== undefined) {
      sanitized.preferences = data.preferences ? data.preferences : null;
    }

    return sanitized;
  }
}