// src/api/routes/sync.routes.ts
import { Router, Request, Response } from 'express';
import { SyncService } from '@/services/SyncService';
import { SyncConfig } from '@/models/SyncConfig';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/utils/error-handler';

const router = Router();

// Middleware to get user config
const getUserConfig = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) {
            return res.status(401).json({ error: 'User ID required' });
        }

        const config = await SyncConfig.findOne({ userId });
        if (!config) {
            return res.status(404).json({ error: 'User configuration not found' });
        }

        req.userConfig = config;
        next();
    } catch (error) {
        logger.error('Error getting user config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

router.use(getUserConfig);

// Start manual sync
router.post('/manual', asyncHandler(async (req: Request, res: Response) => {
    const { direction } = req.body;
    const syncService = new SyncService(req.userConfig!);

    let result;
    if (direction === 'jira_to_trello') {
        result = await syncService.syncJiraToTrello();
    } else if (direction === 'trello_to_jira') {
        result = await syncService.syncTrelloToJira();
    } else {
        // Default to Jira to Trello
        result = await syncService.syncJiraToTrello();
    }

    res.json(result);
}));

// Sync single task
router.post('/task/:taskId', asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { direction } = req.body;
    const syncService = new SyncService(req.userConfig!);

    await syncService.syncSingleTask(taskId, direction);
    res.json({ success: true });
}));

// Get sync status
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
    const syncService = new SyncService(req.userConfig!);
    const status = await syncService.getSyncStatus();
    res.json(status);
}));

// Get sync history
router.get('/history', asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.userConfig!.userId;

    const history = await SyncHistory.find({ userId })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

    const total = await SyncHistory.countDocuments({ userId });

    res.json({
        history,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
        }
    });
}));

// Get unsynced tasks
router.get('/unsynced', asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    const userId = req.userConfig!.userId;

    const query: any = {};
    if (status) {
        query.syncStatus = status;
    }

    const tasks = await Task.find(query).sort({ updatedAt: -1 });
    res.json(tasks);
}));

export default router;