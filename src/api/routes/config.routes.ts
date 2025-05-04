// src/api/routes/config.routes.ts
import { Router, Request, Response } from 'express';
import { SyncConfig } from '@/models/SyncConfig';
import { MappingService } from '@/services/MappingService';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/utils/error-handler';
import Joi from 'joi';
import { JiraConnector } from '@/connectors/JiraConnector';
import { TrelloConnector } from '@/connectors/TrelloConnector';

const router = Router();

// Validation schemas
const configSchema = Joi.object({
    jiraConfig: Joi.object({
        domain: Joi.string().required(),
        email: Joi.string().email().required(),
        apiToken: Joi.string().required(),
        projectKey: Joi.string().required()
    }).required(),
    trelloConfig: Joi.object({
        apiKey: Joi.string().required(),
        apiToken: Joi.string().required(),
        boardId: Joi.string().required()
    }).required(),
    syncFrequency: Joi.string().valid('manual', 'daily', 'hourly').default('daily'),
    syncDirection: Joi.string().valid('jira_to_trello', 'trello_to_jira', 'bidirectional').default('jira_to_trello')
});

const mappingSchema = Joi.object({
    fieldMappings: Joi.array().items(Joi.object({
        jiraField: Joi.string().required(),
        trelloField: Joi.string().required()
    })),
    statusMappings: Joi.array().items(Joi.object({
        jiraStatus: Joi.string().required(),
        trelloStatus: Joi.string().required()
    }))
});

// Get user configuration
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    const config = await SyncConfig.findOne({ userId });

    if (!config) {
        return res.status(404).json({ error: 'Configuration not found' });
    }

    // Remove sensitive data
    const safeConfig = config.toObject();
    if (safeConfig.jiraConfig) {
        safeConfig.jiraConfig.apiToken = '***';
    }
    if (safeConfig.trelloConfig) {
        safeConfig.trelloConfig.apiToken = '***';
        safeConfig.trelloConfig.apiKey = '***';
    }

    res.json(safeConfig);
}));

// Create or update configuration
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    const { error, value } = configSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const mappingService = new MappingService({} as any);
    const configData = {
        ...value,
        userId,
        fieldMappings: value.fieldMappings || mappingService.getDefaultFieldMappings(),
        statusMappings: value.statusMappings || mappingService.getDefaultStatusMappings()
    };

    const config = await SyncConfig.findOneAndUpdate(
        { userId },
        configData,
        { upsert: true, new: true }
    );

    res.json({ message: 'Configuration saved successfully' });
}));

// Update mappings
router.put('/mappings', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    const { error, value } = mappingSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const config = await SyncConfig.findOne({ userId });
    if (!config) {
        return res.status(404).json({ error: 'Configuration not found' });
    }

    if (value.fieldMappings) {
        config.fieldMappings = value.fieldMappings;
    }
    if (value.statusMappings) {
        config.statusMappings = value.statusMappings;
    }

    await config.save();
    res.json({ message: 'Mappings updated successfully' });
}));

// Test connection
router.post('/test-connection', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    const config = await SyncConfig.findOne({ userId });
    if (!config) {
        return res.status(404).json({ error: 'Configuration not found' });
    }
    
    try {
        const jiraConnector = new JiraConnector(config.jiraConfig);
        const trelloConnector = new TrelloConnector(config.trelloConfig);

        // Test Jira connection
        const jiraResult = await jiraConnector.getIssuesByProject();

        // Test Trello connection
        const trelloResult = await trelloConnector.getCardsByBoard();

        res.json({
            jira: {
                status: 'success',
                issuesFound: jiraResult.length
            },
            trello: {
                status: 'success',
                cardsFound: trelloResult.length
            }
        });
    } catch (error) {
        logger.error('Connection test failed:', error);
        res.status(400).json({
            error: 'Connection test failed',
            details: error.message
        });
    }
}));

// Get default mappings
router.get('/default-mappings', (req: Request, res: Response) => {
    const mappingService = new MappingService({} as any);
    res.json({
        fieldMappings: mappingService.getDefaultFieldMappings(),
        statusMappings: mappingService.getDefaultStatusMappings()
    });
});

export default router;