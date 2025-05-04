// src/api/routes/commands.routes.ts
import { Router, Request, Response } from 'express';
import { CommandParser } from '@/services/CommandParser';
import { SyncService } from '@/services/SyncService';
import { SyncConfig } from '@/models/SyncConfig';
import { Task } from '@/models/Task';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/utils/error-handler';

const router = Router();
const commandParser = new CommandParser();

// Parse and execute natural language command
router.post('/execute', asyncHandler(async (req: Request, res: Response) => {
  const { command } = req.body;
  const userId = req.headers['x-user-id'] as string;

  if (!command || !userId) {
    return res.status(400).json({ error: 'Command and user ID required' });
  }

  const parsed = commandParser.parseCommand(command);
  logger.info('Parsed command:', parsed);

  const config = await SyncConfig.findOne({ userId });
  if (!config) {
    return res.status(404).json({ error: 'User configuration not found' });
  }

  const syncService = new SyncService(config);

  switch (parsed.action) {
    case 'sync':
      if (parsed.params.taskId) {
        // Sync single task
        const direction = parsed.params.direction || 'jira_to_trello';
        await syncService.syncSingleTask(parsed.params.taskId, direction);
        res.json({ 
          response: `Tarea ${parsed.params.taskId} sincronizada correctamente`,
          action: 'sync_task'
        });
      } else if (parsed.params.direction) {
        // Directional sync
        const result = parsed.params.direction === 'jira_to_trello' 
          ? await syncService.syncJiraToTrello()
          : await syncService.syncTrelloToJira();
        res.json({ 
          response: `Sincronización completada: ${result.tasksSynced} tareas sincronizadas, ${result.tasksErrored} errores`,
          action: 'directional_sync',
          result
        });
      } else {
        // General sync (default to Jira to Trello)
        const result = await syncService.syncJiraToTrello();
        res.json({ 
          response: `Sincronización completada: ${result.tasksSynced} tareas sincronizadas, ${result.tasksErrored} errores`,
          action: 'general_sync',
          result
        });
      }
      break;

    case 'status':
      const status = await syncService.getSyncStatus();
      res.json({ 
        response: `Estado de sincronización: ${status.pendingTasks} pendientes, ${status.erroredTasks} con errores. Última sincronización: ${status.lastSync || 'nunca'}`,
        action: 'status',
        status
      });
      break;

    case 'list':
      const query: any = {};
      if (parsed.params.entityType === 'pending') {
        query.syncStatus = 'pending';
      } else if (parsed.params.entityType === 'errors') {
        query.syncStatus = 'error';
      }
      
      const tasks = await Task.find(query).limit(10);
      res.json({ 
        response: `Encontradas ${tasks.length} tareas`,
        action: 'list',
        tasks
      });
      break;

    case 'configure':
      res.json({ 
        response: 'Para configurar el agente, visita el panel de configuración',
        action: 'configure',
        configUrl: '/config'
      });
      break;

    case 'error':
      res.status(400).json({ 
        error: parsed.params.errorMessage,
        errorCode: parsed.params.errorCode,
        suggestions: commandParser.getSuggestions(command)
      });
      break;

    default:
      res.status(400).json({ error: 'Comando no soportado' });
  }
}));

// Get command suggestions
router.get('/suggestions', (req: Request, res: Response) => {
  const { partial } = req.query;
  
  if (!partial) {
    return res.json([]);
  }

  const suggestions = commandParser.getSuggestions(partial as string);
  res.json(suggestions);
});

export default router;