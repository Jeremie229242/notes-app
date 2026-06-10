import Joi from "joi";

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional().messages({
    "string.min": "Le prénom doit comporter au moins 1 caractère.",
    "string.max": "Le prénom ne doit pas dépasser 50 caractères.",
  }),
  lastName: Joi.string().min(1).max(50).optional().messages({
    "string.min": "Le nom de famille doit comporter au moins 1 caractère.",
    "string.max": "Le nom de famille ne doit pas dépasser 50 caractères.",
  }),
  bio: Joi.string().max(500).optional().allow("").messages({
    "string.max": "La biographie ne doit pas dépasser 500 caractères.",
  }),
  avatarUrl: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Avatar URL doit etre valide",
  }),
  preferences: Joi.object().optional().messages({
    "object.base": "Les préférences doivent être un objet valide",
  }),
});

export const createProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional().messages({
    "string.min": "Le prénom doit comporter au moins 1 caractère.",
    "string.max": "Le prénom ne doit pas dépasser 50 caractères.",
  }),
  lastName: Joi.string().min(1).max(50).optional().messages({
    "string.min": "Le nom de famille doit comporter au moins 1 caractère.",
    "string.max": "Le nom de famille ne doit pas dépasser 50 caractères.",
  }),
  bio: Joi.string().max(500).optional().allow("").messages({
    "string.max": "La biographie ne doit pas dépasser 500 caractères.",
  }),
  avatarUrl: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Avatar URL doit etre valide",
  }),
  preferences: Joi.object().optional().default({}).messages({
    "object.base": "Les préférences doivent être un objet valide",
  }),
});