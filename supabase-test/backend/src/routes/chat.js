import { Router } from 'express';
import { createChat, listChatMessages } from '../controllers/chatController.js';

const router = Router();

router.post('/', createChat);
router.get('/:documentId', listChatMessages);

export default router;
