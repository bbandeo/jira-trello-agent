// src/api/index.ts
import { Router } from 'express';
import syncRoutes from './routes/sync.routes';
import commandsRoutes from './routes/commands.routes';
import configRoutes from './routes/config.routes';
import { logger } from '@/utils/logger';

const router = Router();

// Mount route modules
router.use('/sync', syncRoutes);
router.use('/commands', commandsRoutes);
router.use('/config', configRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 404 handler
router.use((req, res) => {
  logger.warn(`404 - ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Not found',
    path: req.path
  });
});

export default router;