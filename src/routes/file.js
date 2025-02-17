import express from 'express';
import
    {
        uploadFile,
        getFilesList,
        getFileInfo,
        downloadFile,
        updateFile,
        deleteFile
    } from '../controllers/fileController.js';
import authMiddleware from '../middleware/auth.js';
import { upload, handleMulterError } from '../middleware/upload.js';

const router = express.Router();

// Все маршруты защищены middleware аутентификации
router.use(authMiddleware);

// Маршруты для работы с файлами
router.post('/upload', upload.single('file'), handleMulterError, uploadFile);
router.get('/list', getFilesList);
router.get('/:id', getFileInfo);
router.get('/download/:id', downloadFile);
router.put('/update/:id', upload.single('file'), handleMulterError, updateFile);
router.delete('/delete/:id', deleteFile);

export default router;
