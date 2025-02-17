import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';

const uploadFile = async (req, res) =>
{
    try
    {
        if (!req.file)
        {
            return res.status(400).json({ error: 'Файл не был загружен' });
        }

        const { originalname, mimetype, size } = req.file;
        const extension = path.extname(originalname);

        // Вставляем запись в базу данных
        const [result] = await pool.query(
            'INSERT INTO files (name, extension, mime_type, size, user_id) VALUES (?, ?, ?, ?, ?)',
            [originalname, extension, mimetype, size, req.userId]
        );

        const fileId = result.insertId;

        // Сохраняем файл
        const filePath = path.join(process.env.UPLOAD_PATH, `${fileId}${extension}`);
        try
        {
            await fs.writeFile(filePath, req.file.buffer);
        } catch (writeError)
        {
            console.error('Ошибка при записи файла на диск:', writeError);
            await pool.query(
                'DELETE FROM files WHERE id = ?',
                [fileId]
            );
            return res.status(500).json({ error: 'Ошибка при сохранении файла' });
        }

        res.status(201).json({
            message: 'Файл успешно загружен',
            fileId,
            filename: originalname,
            size,
            mimetype,
        });
    } catch (error)
    {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Ошибка при загрузке файла' });
    }
};

const getFilesList = async (req, res) =>
{
    try
    {
        let listSize = parseInt(req.query.list_size) || 10;
        let page = parseInt(req.query.page) || 1;

        // Валидация параметров пагинации
        if (listSize < 1) listSize = 10;
        if (page < 1) page = 1;

        const offset = (page - 1) * listSize;

        // Получаем общее количество файлов
        const [totalCount] = await pool.query(
            'SELECT COUNT(*) as count FROM files WHERE user_id = ?',
            [req.userId]
        );

        // Получаем файлы с пагинацией
        const [files] = await pool.query(
            'SELECT id, name, extension, mime_type, size, upload_date FROM files WHERE user_id = ? LIMIT ? OFFSET ?',
            [req.userId, listSize, offset]
        );

        const totalPages = Math.ceil(totalCount[0].count / listSize);

        res.json({
            files,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCount[0].count,
                itemsPerPage: listSize
            }
        });
    }
    catch (error)
    {
        console.error('Get files list error:', error);
        res.status(500).json({ error: 'Ошибка при получении списка файлов' });
    }
};

const getFileInfo = async (req, res) =>
{
    try
    {
        const fileId = req.params.id;

        const [files] = await pool.query(
            'SELECT id, name, extension, mime_type, size, upload_date FROM files WHERE id = ? AND user_id = ?',
            [fileId, req.userId]
        );

        if (files.length === 0)
        {
            return res.status(404).json({ error: 'Файл не найден' });
        }

        res.json(files[0]);
    }
    catch (error)
    {
        console.error('Get file info error:', error);
        res.status(500).json({ error: 'Ошибка при получении информации о файле' });
    }
};

const downloadFile = async (req, res) =>
{
    try
    {
        const fileId = req.params.id;

        const [files] = await pool.query(
            'SELECT name, mime_type FROM files WHERE id = ? AND user_id = ?',
            [fileId, req.userId]
        );

        if (files.length === 0)
        {
            return res.status(404).json({ error: 'Файл не найден' });
        }

        const file = files[0];
        const [fileInfo] = await pool.query(
            'SELECT extension FROM files WHERE id = ? AND user_id = ?',
            [fileId, req.userId]
        );
        const extension = fileInfo[0].extension;
        const filePath = path.join(process.env.UPLOAD_PATH, `${req.params.id}${extension}`);

        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);

        const fileStream = await fs.readFile(filePath);
        res.send(fileStream);
    }
    catch (error)
    {
        console.error('File download error:', error);
        res.status(500).json({ error: 'Ошибка при скачивании файла' });
    }
};

const updateFile = async (req, res) =>
{
    try
    {
        if (!req.file)
        {
            return res.status(400).json({ error: 'Файл не был загружен' });
        }

        const fileId = req.params.id;

        const [files] = await pool.query(
            'SELECT extension FROM files WHERE id = ? AND user_id = ?',
            [fileId, req.userId]
        );

        if (files.length === 0)
        {
            return res.status(404).json({ error: 'Файл не найден' });
        }

        const oldExtension = files[0].extension;
        const oldFilePath = path.join(process.env.UPLOAD_PATH, `${fileId}${oldExtension}`);

        const { originalname, mimetype, size } = req.file;
        const newExtension = path.extname(originalname);
        const newFilePath = path.join(process.env.UPLOAD_PATH, `${fileId}${newExtension}`);

        // Удаляем старый файл
        try
        {
            await fs.unlink(oldFilePath);
        } catch (unlinkError)
        {
            console.error('Ошибка при удалении старого файла:', unlinkError);
            // Можно вернуть ошибку 500 или проигнорировать, если файл не существует
            //  return res.status(500).json({ error: 'Ошибка при удалении старого файла' });
        }

        await pool.query(
            "UPDATE files SET name = ?, extension = ?, mime_type = ?, size = ? WHERE id = ?",
            [originalname, newExtension, mimetype, size, fileId]
        );

        // Сохраняем новый файл
        try
        {
            await fs.writeFile(newFilePath, req.file.buffer);
        } catch (writeError)
        {
            console.error('Ошибка при записи файла на диск:', writeError);
            // Можно откатить изменения в базе данных, если не удалось сохранить файл
            // await pool.query(
            //     "UPDATE files SET name = ?, extension = ?, mime_type = ?, size = ? WHERE id = ?",
            //     [oldName, oldExtension, oldMimeType, oldSize, fileId] // Параметры для отката
            // );
            return res.status(500).json({ error: 'Ошибка при сохранении файла' });
        }

        res.json({
            message: 'Файл успешно обновлён',
            filename: originalname,
            size,
            mimetype: mimetype
        });
    } catch (error)
    {
        console.error('Ошибка при обновлении файла:', error);
        res.status(500).json({ error: 'Ошибка при обновлении файла' });
    }
};


const deleteFile = async (req, res) =>
{
    try
    {
        const fileId = req.params.id;

        // Проверяем существование файла и права доступа
        const [files] = await pool.query(
            'SELECT id FROM files WHERE id = ? AND user_id = ?',
            [fileId, req.userId]
        );

        if (files.length === 0)
        {
            return res.status(404).json({ error: 'Файл не найден' });
        }

        const [fileInfo] = await pool.query(
            'SELECT extension FROM files WHERE id = ? AND user_id = ?',
            [fileId, req.userId]
        );
        const extension = fileInfo[0].extension;

        // Удаляем файл из файловой системы
        const filePath = path.join(process.env.UPLOAD_PATH, `${fileId}${extension}`);
        await fs.unlink(filePath);

        // Удаляем запись из базы данных
        await pool.query('DELETE FROM files WHERE id = ?', [fileId]);

        res.json({ message: 'Файл успешно удален' });
    }
    catch (error)
    {
        console.error('File deletion error:', error);
        res.status(500).json({ error: 'Ошибка при удалении файла' });
    }
};

export
{
    uploadFile,
    getFilesList,
    getFileInfo,
    downloadFile,
    updateFile,
    deleteFile
};
