import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import uploadRouter from './routes/upload.js';
import chatRouter from './routes/chat.js';
import statusRouter from './routes/status.js';
import documentsRouter from './routes/documents.js';
import webhookRouter from './routes/webhook.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Supabase Document Analysis API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/upload', uploadRouter);
app.use('/api/chat', chatRouter);
app.use('/api/status', statusRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/webhook/n8n', webhookRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Sunucu hatası', message: err.message });
});

const port = process.env.API_PORT || 8787;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
