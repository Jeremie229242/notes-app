import {
    createServiceError,
    isValidUUID,
    sanitizeInput,
  } from "../../../partage/utils";
  import { CreateTagRequest, Tag } from "../../../partage/types";
  import prisma from "./database";
  
  export class TagsService {
    async createTag(userId: string, tagData: CreateTagRequest): Promise<Tag> {
      // Nettoyer et valider les données des tags
      const sanitizedName = sanitizeInput(tagData.name);
      const sanitizedColor = tagData.color
        ? sanitizeInput(tagData.color)
        : undefined;
  
      // Valider le format de couleur s'il est fourni (format de couleur hexadécimal).
      if (sanitizedColor && !this.isValidHexColor(sanitizedColor)) {
        throw createServiceError(
          "Format de couleur invalide, utilisez le format de couleur hexadécimal. (eg: #FF5733 or #F73)",
          400
        );
      }
  
      try {
        // creer tag
        const tag = await prisma.tag.create({
          data: {
            userId,
            name: sanitizedName,
            color: sanitizedColor,
          },
        });
  
        return tag as Tag;
      } catch (error) {
        // gérer l'erreur de violation de contrainte d'unicité
        if (error.code === "P2002") {
          throw createServiceError("Ce Tag existe deja", 409);
        }
        throw createServiceError("Erreur de création de tag", 500);
      }
    }
  
    async getTagById(tagId: string, userId: string): Promise<Tag> {
      if (!isValidUUID(tagId)) {
        throw createServiceError("Invalide tag id", 400);
      }
  
      const tag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          userId,
        },
      });
  
      if (!tag) {
        throw createServiceError("Tag non trouvé", 404);
      }
  
      return tag as Tag;
    }
  
    async getTagsByUser(
      page: number = 1,
      limit: number = 50,
      search?: string,
      userId?: string
    ): Promise<{
      tags: Tag[];
      total: number;
      page: number;
      totalPages: number;
    }> {
      const skip = (page - 1) * limit;
  
      // build par clause
      const whereClause: any = {
        userId,
      };
  
      // add search functionality
      if (search) {
        const sanitizedSearch = sanitizeInput(search);
        whereClause.name = {
          contains: sanitizedSearch,
          mode: "insensitive",
        };
      }
  
      const [tags, total] = await Promise.all([
        prisma.tag.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { name: "asc" }, // Ordre tags alphebetique
        }),
        prisma.tag.count({
          where: whereClause,
        }),
      ]);
  
      const totalPages = Math.ceil(total / limit);
  
      return {
        tags: tags as Tag[],
        total,
        page,
        totalPages,
      };
    }
  
    async validateTags(
      tagIds: string[],
      userId: string
    ): Promise<{
      validTags: Tag[];
      invalidTagIds: string[];
    }> {
      const validTags: Tag[] = [];
      const invalidTagIds: string[] = [];
  
      for (const tagId of tagIds) {
        if (!isValidUUID(tagId)) {
          invalidTagIds.push(tagId);
          continue;
        }
  
        try {
          const tag = await this.getTagById(tagId, userId);
          validTags.push(tag);
        } catch (error) {
          invalidTagIds.push(tagId);
        }
      }
  
      return { validTags, invalidTagIds };
    }
  
    private isValidHexColor(color: string): boolean {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      return hexColorRegex.test(color);
    }
  }