import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) =>
{
    // Проверяем размер файла
    if (
        parseInt(req.headers['content-length']) > parseInt(process.env.MAX_FILE_SIZE)
    )
    {
        cb(new Error('Файл превышает максимально допустимый размер'), false);
        return;
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE),
    },
});

// Middleware для обработки ошибок multer
const handleMulterError = (err, req, res, next) =>
{
    if (err instanceof multer.MulterError)
    {
        if (err.code === 'LIMIT_FILE_SIZE')
        {
            return res.status(400).json({
                error: 'Файл превышает максимально допустимый размер',
            });
        }
        return res.status(400).json({ error: err.message });
    } else if (err)
    {
        return res.status(400).json({ error: err.message });
    }
    next();
};

export { upload, handleMulterError };
