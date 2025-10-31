import { Router } from 'express';
import { handleUpload, uploadMiddleware } from '../controllers/uploadController.js';

const router = Router();

router.post('/', uploadMiddleware, handleUpload);

export default router;
