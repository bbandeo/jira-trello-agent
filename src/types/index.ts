// src/types/index.ts
import { ISyncConfig } from '@/models/SyncConfig';

declare global {
  namespace Express {
    interface Request {
      userConfig?: ISyncConfig;
    }
  }
}

// Define types for better IDE support
export type Direction = 'jira_to_trello' | 'trello_to_jira';
export type SyncStatus = 'pending' | 'synced' | 'error';
export type SyncType = 'manual' | 'automatic';
export type SyncFrequency = 'manual' | 'daily' | 'hourly';

// Export all models for easier imports
export * from '@/models/Task';
export * from '@/models/SyncConfig';
export * from '@/models/SyncHistory';