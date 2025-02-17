import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { generateTokens, verifyRefreshToken } from '../config/jwt.js';

const signup = async (req, res) =>
{
    try
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id, password } = req.body;

        // Проверяем, существует ли пользователь
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE identifier = ?',
            [id]
        );

        if (existingUsers.length > 0)
        {
            return res.status(400).json({
                error: 'Пользователь с таким email/телефоном уже существует'
            });
        }

        // Хешируем пароль
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Создаем пользователя
        const [result] = await pool.query(
            'INSERT INTO users (identifier, password_hash) VALUES (?, ?)',
            [id, hashedPassword]
        );

        const userId = result.insertId;

        // Генерируем токены
        const { accessToken, refreshToken } = generateTokens(userId);

        // Сохраняем refresh токен в базе
        await pool.query(
            'INSERT INTO tokens (user_id, refresh_token) VALUES (?, ?)',
            [userId, refreshToken]
        );

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            accessToken,
            refreshToken
        });
    }
    catch (error)
    {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
    }
};

const signin = async (req, res) =>
{
    try
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id, password } = req.body;

        // Ищем пользователя
        const [users] = await pool.query(
            'SELECT id, password_hash FROM users WHERE identifier = ?',
            [id]
        );

        if (users.length === 0)
        {
            return res.status(401).json({
                error: 'Неверный email/телефон или пароль'
            });
        }

        const user = users[0];

        // Проверяем пароль
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword)
        {
            return res.status(401).json({
                error: 'Неверный email/телефон или пароль'
            });
        }

        // Генерируем новые токены
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Сохраняем refresh токен в базе
        await pool.query(
            'INSERT INTO tokens (user_id, refresh_token) VALUES (?, ?)',
            [user.id, refreshToken]
        );

        res.json({ accessToken, refreshToken });
    }
    catch (error)
    {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Ошибка при входе в систему' });
    }
};

const refreshToken = async (req, res) =>
{
    try
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            return res.status(400).json({ errors: errors.array() });
        }

        const { refreshToken: token } = req.body;

        // Проверяем refresh токен
        const decoded = verifyRefreshToken(token);
        if (!decoded)
        {
            return res.status(401).json({ error: 'Недействительный refresh токен' });
        }

        // Проверяем токен в базе
        const [tokens] = await pool.query(
            'SELECT id FROM tokens WHERE user_id = ? AND refresh_token = ? AND is_valid = true',
            [decoded.userId, token]
        );

        if (tokens.length === 0)
        {
            return res.status(401).json({ error: 'Токен не найден или недействителен' });
        }

        // Генерируем новые токены
        const { accessToken, refreshToken } = generateTokens(decoded.userId);

        // Обновляем refresh токен в базе
        await pool.query(
            'UPDATE tokens SET is_valid = false WHERE id = ?',
            [tokens[0].id]
        );

        await pool.query(
            'INSERT INTO tokens (user_id, refresh_token) VALUES (?, ?)',
            [decoded.userId, refreshToken]
        );

        res.json({ accessToken, refreshToken });
    }
    catch (error)
    {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении токена' });
    }
};

const logout = async (req, res) =>
{
    try
    {
        // Инвалидируем все refresh токены текущего устройства
        await pool.query(
            'UPDATE tokens SET is_valid = false WHERE user_id = ? AND is_valid = true',
            [req.userId]
        );

        res.json({ message: 'Успешный выход из системы' });
    }
    catch (error)
    {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Ошибка при выходе из системы' });
    }
};

const getInfo = async (req, res) =>
{
    try
    {
        const [users] = await pool.query(
            'SELECT identifier FROM users WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0)
        {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ id: users[0].identifier });
    }
    catch (error)
    {
        console.error('Get info error:', error);
        res.status(500).json({ error: 'Ошибка при получении информации о пользователе' });
    }
};

export { signup, signin, refreshToken, logout, getInfo };
