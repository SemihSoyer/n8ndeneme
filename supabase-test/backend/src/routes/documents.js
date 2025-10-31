import { Router } from 'express';
import { getDocument, downloadDocument } from '../controllers/documentsController.js';

const router = Router();

router.get('/:documentId', getDocument);
router.get('/:documentId/download', downloadDocument);

export default router;
