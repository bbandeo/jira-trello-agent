// src/utils/scheduler.ts
import cron from 'node-cron';
import { SyncConfig } from '@/models/SyncConfig';
import { SyncService } from '@/services/SyncService';
import { logger } from './logger';

export const setupCronJobs = () => {
  // Daily sync at 2 AM
  cron.schedule('0 2 * * *', async () => {
    await runScheduledSync('daily');
  });

  // Hourly sync
  cron.schedule('0 * * * *', async () => {
    await runScheduledSync('hourly');
  });

  logger.info('Cron jobs initialized');
};

const runScheduledSync = async (frequency: 'daily' | 'hourly') => {
  try {
    const configs = await SyncConfig.find({ 
      syncFrequency: frequency,
      isActive: true 
    });

    logger.info(`Starting ${frequency} sync for ${configs.length} users`);

    for (const config of configs) {
      try {
        const syncService = new SyncService(config);
        
        if (config.syncDirection === 'jira_to_trello' || config.syncDirection === 'bidirectional') {
          await syncService.syncJiraToTrello();
        }
        
        if (config.syncDirection === 'trello_to_jira' || config.syncDirection === 'bidirectional') {
          await syncService.syncTrelloToJira();
        }
        
        logger.info(`Sync completed for user ${config.userId}`);
      } catch (error) {
        logger.error(`Sync failed for user ${config.userId}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in scheduled sync:', error);
  }
};