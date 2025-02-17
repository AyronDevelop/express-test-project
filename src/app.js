import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/file.js';
import fs from 'fs/promises';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

async function ensureUploadDir ()
{
    try
    {
        await fs.mkdir(process.env.UPLOAD_PATH, { recursive: true });
    }
    catch (error)
    {
        if (error.code !== 'EEXIST')
        {
            console.error('Error creating upload directory:', error);
            throw error;
        }
    }
}

ensureUploadDir();

// Middleware
app.use(cors()); // Разрешаем CORS для всех доменов
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Маршруты
app.use('/', authRoutes);
app.use('/file', fileRoutes);

// Обработка ошибок
app.use((err, req, res, next) =>
{
    console.error(err.stack);
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.use((req, res) =>
{
    res.status(404).json({ error: 'Маршрут не найден' });
});



app.listen(port, () =>
{
    console.log(`Сервер запущен на порту ${port}`);
});

export default app;
