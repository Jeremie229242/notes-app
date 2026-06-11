import Joi from "joi";

export const searchSchema = Joi.object({
  q: Joi.string().max(500).optional().allow(""),
  tags: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),
  page: Joi.number().integer().min(1).max(1000).optional(),
  size: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().valid("relevance", "created", "updated").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
  // Parametre de recherche avancer
  fuzzy: Joi.boolean().optional(),
  fuzziness: Joi.alternatives()
    .try(Joi.number().integer().min(0).max(2), Joi.string().valid("AUTO"))
    .optional(),
  dateFrom: Joi.string().isoDate().optional(),
  dateTo: Joi.string().isoDate().optional(),
  createdLast: Joi.string()
    .pattern(/^\d+[dwmy]$/)
    .optional()
    .messages({
      "string.pattern.base":
        "createdLast doit être au format suivant : '7d', '30d', '1y'",
    }),
  contentLength: Joi.string().valid("short", "medium", "long").optional(),
});

export const searchSuggestionsSchema = Joi.object({
  q: Joi.string().min(1).max(100).required(),
});