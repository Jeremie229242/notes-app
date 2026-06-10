import Joi from "joi";

export const createTagSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .messages({
      "string.min": "Tag nom doit comporter au moins 1 caractère.",
      "string.max": "Tag nom ne doit pas dépasser 50 caractères.",
      "string.pattern.base":
        "Tag nom ne peut contenir que des lettres, des chiffres, des espaces, des tirets et des traits de soulignement.",
      "any.required": "Tag nom est obligatoire",
    }),
  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base":
        "La couleur doit être un format de couleur hexadécimal valide: (e.g., #FF5733 or #F73)",
    }),
});

export const updateTagSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .optional()
    .messages({
      "string.min": "Tag nom doit comporter au moins 1 caractère.",
      "string.max": "Tag nom ne doit pas dépasser 50 caractères.",
      "string.pattern.base":
        "Tag nom ne peut contenir que des lettres, des chiffres, des espaces, des tirets et des traits de soulignement.",
    }),
  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base":
        "La couleur doit être un format de couleur hexadécimal valide: (e.g., #FF5733 or #F73)",
    }),
});

export const getTagsByUserSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    "number.base": "La page doit être un numéro",
    "number.integer": "Page doit être un entier",
    "number.min": "Page doit être au moins 1",
  }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .messages({
      "number.base": "Limitdoit être un numéro",
      "number.integer": "Limit doit être un entier",
      "number.min": "Limit doit être au moins 1",
      "number.max": "Limit ne doit pas dépasser 100",
    }),
  search: Joi.string().min(1).max(100).optional().messages({
    "string.min": "Le terme de recherche doit être au moins 1 caractère de long",
    "string.max": "Le terme de recherche ne doit pas dépasser 100 caractères.",
  }),
});

export const validateTagsSchema = Joi.object({
  tagIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    "array.base": "Tag IDs doit etre un tableau",
    "array.min": "Au moins un id tag est requis",
    "string.uuid": "Chaque id tag doit être valide UUID",
    "any.required": "Tag IDs sont obligatoires",
  }),
});

export const tagIdParamSchema = Joi.object({
  tagId: Joi.string().uuid().required().messages({
    "string.uuid": "Tag ID doit etre valide UUID",
    "any.required": "Tag ID est obligatoire",
  }),
});