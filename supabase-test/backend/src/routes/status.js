import { Router } from 'express';
import { getTableStatus } from '../controllers/statusController.js';

const router = Router();

router.get('/:tableId', getTableStatus);

export default router;
