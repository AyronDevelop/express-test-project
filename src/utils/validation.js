import { body } from 'express-validator';

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const phoneRegex = /^[0-9]{10,}$/;

const validateIdentifier = (value) =>
{
    if (!emailRegex.test(value) && !phoneRegex.test(value))
    {
        throw new Error('Идентификатор должен быть действительным email или телефоном');
    }
    return true;
};

const validatePassword = (value) =>
{
    if (value.length < 6)
    {
        throw new Error('Пароль должен содержать минимум 6 символов');
    }
    return true;
};

// Валидация для регистрации и входа
const authValidationRules = [
    body('id')
        .trim()
        .notEmpty()
        .withMessage('Идентификатор обязателен')
        .custom(validateIdentifier),

    body('password')
        .trim()
        .notEmpty()
        .withMessage('Пароль обязателен')
        .custom(validatePassword)
];

// Валидация для обновления токена
const refreshTokenValidationRules = [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh токен обязателен')
];

// Валидация параметров пагинации
const paginationValidationRules = [
    body('list_size')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Размер списка должен быть положительным числом'),

    body('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Номер страницы должен быть положительным числом')
];

export
{
    validateIdentifier,
    validatePassword,
    authValidationRules,
    refreshTokenValidationRules,
    paginationValidationRules
};
