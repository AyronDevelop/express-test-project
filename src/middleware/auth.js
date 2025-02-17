import { verifyAccessToken } from '../config/jwt.js';
import { pool } from '../config/database.js';

const authMiddleware = async (req, res, next) =>
{
    try
    {
        const authHeader = req.headers.authorization;
        if (!authHeader)
        {
            return res.status(401).json({ error: 'Отсутствует токен авторизации' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);

        if (!decoded)
        {
            return res.status(401).json({ error: 'Недействительный или истекший токен' });
        }

        // Проверяем, не был ли токен инвалидирован при выходе
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM tokens WHERE user_id = ? AND is_valid = true',
            [decoded.userId]
        );

        if (rows[0].count === 0)
        {
            return res.status(401).json({ error: 'Сессия истекла, требуется повторная авторизация' });
        }

        req.userId = decoded.userId;
        next();
    }
    catch (error)
    {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Ошибка сервера при проверке авторизации' });
    }
};

export default authMiddleware;
