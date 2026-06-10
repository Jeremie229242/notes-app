import Joi from 'joi';

export const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'L\'adresse e-mail doit être valide.',
        'any.required': 'Email est obligatoire',
    }),
    password: Joi.string().min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
        'string.min': 'Le mot de passe doit comporter au moins 8 caractères.',
        'string.pattern.base': 'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre.',
        'any.required': 'mot de Passe est obligatoire',
    }),
})

export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'L\'adresse e-mail doit être valide.',
        'any.required': 'Email est obligatoire',
    }),
    password: Joi.string().required().messages({
        'any.required': 'mot de Passe est obligatoire',
    }),
});

export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token est obligatoire',
    }),
});