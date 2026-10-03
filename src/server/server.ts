/**
 * Express Server for Nigerian Statutory Tax Compliance Platform
 */

import express from 'express';
import * as path from 'node:path';
import { apiRouter } from './routes/api.routes';

export const app = express();
const PORT = process.env.PORT || 6500;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static educational and calculation portal
app.use(express.static(path.resolve(process.cwd(), 'public')));

// REST API
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'nigerian-tax-platform' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Nigerian Tax Platform] Running on http://localhost:${PORT}`);
  });
}
