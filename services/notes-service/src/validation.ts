import Joi from "joi";

export const createNoteSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    "string.min": "Le titre doit comporter au moins 1 caractère.",
    "string.max": "Le titre ne doit pas dépasser 200 caractères.",
    "any.required": "Titre est obligatoire",
  }),
  content: Joi.string().min(1).max(50000).required().messages({
    "string.min": "Content doit comporter au moins 1 caractère",
    "string.max": "Content ne doit pas dépasser 50 000 caractères",
    "any.required": "Content est obligatoire",
  }),
  tagIds: Joi.array().items(Joi.string().uuid()).optional().messages({
    "array.base": "Tag IDs doit être un tableau",
    "string.uuid": "Chaque identifiant tags doit être valide UUID",
  }),
});

export const updateNoteSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().messages({
    "string.min": "Titre doit comporter au moins 1 caractère",
    "string.max": "Le titre ne doit pas dépasser 200 caractères.",
  }),
  content: Joi.string().min(1).max(50000).optional().messages({
    "string.min": "Content doit comporter au moins 1 caractère",
    "string.max": "Content ne doit pas dépasser 50 000 caractères",
  }),
  tagIds: Joi.array().items(Joi.string().uuid()).optional().messages({
    "array.base": "Tag IDs doit être un tableau",
    "string.uuid": "Chaque identifiant tags doit être valide UUID",
  }),
});

export const getNotesByUserSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    "number.base": "Page doit être un nombre",
    "number.integer": "Page doit être un entier",
    "number.min": "Page doit être au moins 1",
  }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      "number.base": "La limite doit être un nombre",
      "number.integer": "La limite doit être un entier",
      "number.min": "La limite doit être d'au moins 1",
      "number.max": "La limite ne doit pas dépasser 100",
    }),
  search: Joi.string().max(200).optional().messages({
    "string.max": "La requête de recherche ne doit pas dépasser 200 caractères.",
  }),
});