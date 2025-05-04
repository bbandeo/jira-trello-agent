// src/services/SyncService.ts
import { JiraConnector, JiraIssue } from '@/connectors/JiraConnector';
import { TrelloConnector, TrelloCard } from '@/connectors/TrelloConnector';
import { Task, ITask } from '@/models/Task';
import { SyncConfig, ISyncConfig } from '@/models/SyncConfig';
import { SyncHistory, ISyncHistory } from '@/models/SyncHistory';
import { MappingService } from './MappingService';
import { logger } from '@/utils/logger';

export interface SyncResult {
  success: boolean;
  tasksSynced: number;
  tasksErrored: number;
  errorMessages: string[];
  duration: number;
}

export class SyncService {
  private jiraConnector: JiraConnector;
  private trelloConnector: TrelloConnector;
  private mappingService: MappingService;
  private config: ISyncConfig;

  constructor(config: ISyncConfig) {
    this.config = config;
    this.jiraConnector = new JiraConnector(config.jiraConfig);
    this.trelloConnector = new TrelloConnector(config.trelloConfig);
    this.mappingService = new MappingService(config);
  }

  async syncJiraToTrello(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      tasksSynced: 0,
      tasksErrored: 0,
      errorMessages: [],
      duration: 0
    };

    try {
      const [jiraIssues, trelloLists] = await Promise.all([
        this.jiraConnector.getIssuesByProject(),
        this.trelloConnector.getLists()
      ]);

      for (const jiraIssue of jiraIssues) {
        try {
          await this.syncJiraIssueToTrello(jiraIssue, trelloLists);
          result.tasksSynced++;
        } catch (error) {
          result.tasksErrored++;
          result.errorMessages.push(`Error syncing issue ${jiraIssue.key}: ${error.message}`);
          logger.error(`Error syncing issue ${jiraIssue.key}:`, error);
        }
      }

      result.duration = Date.now() - startTime;
      result.success = result.tasksErrored === 0;

      await this.createSyncHistory('jira_to_trello', result);
      return result;
    } catch (error) {
      result.success = false;
      result.errorMessages.push(`Sync failed: ${error.message}`);
      logger.error('Sync failed:', error);
      throw error;
    }
  }

  async syncTrelloToJira(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      tasksSynced: 0,
      tasksErrored: 0,
      errorMessages: [],
      duration: 0
    };

    try {
      const [trelloCards, trelloLists] = await Promise.all([
        this.trelloConnector.getCardsByBoard(),
        this.trelloConnector.getLists()
      ]);

      for (const trelloCard of trelloCards) {
        try {
          await this.syncTrelloCardToJira(trelloCard, trelloLists);
          result.tasksSynced++;
        } catch (error) {
          result.tasksErrored++;
          result.errorMessages.push(`Error syncing card ${trelloCard.id}: ${error.message}`);
          logger.error(`Error syncing card ${trelloCard.id}:`, error);
        }
      }

      result.duration = Date.now() - startTime;
      result.success = result.tasksErrored === 0;

      await this.createSyncHistory('trello_to_jira', result);
      return result;
    } catch (error) {
      result.success = false;
      result.errorMessages.push(`Sync failed: ${error.message}`);
      logger.error('Sync failed:', error);
      throw error;
    }
  }

  async syncSingleTask(taskId: string, direction: 'jira_to_trello' | 'trello_to_jira'): Promise<void> {
    if (direction === 'jira_to_trello') {
      const jiraIssue = await this.jiraConnector.getIssue(taskId);
      const trelloLists = await this.trelloConnector.getLists();
      await this.syncJiraIssueToTrello(jiraIssue, trelloLists);
    } else {
      const trelloCard = await this.trelloConnector.getCard(taskId);
      const trelloLists = await this.trelloConnector.getLists();
      await this.syncTrelloCardToJira(trelloCard, trelloLists);
    }
  }

  private async syncJiraIssueToTrello(jiraIssue: JiraIssue, trelloLists: any[]): Promise<void> {
    let task = await Task.findOne({ jiraId: jiraIssue.id });

    if (!task) {
      task = new Task({
        jiraId: jiraIssue.id,
        title: jiraIssue.fields.summary,
        syncDirection: 'jira_to_trello',
        status: 'pending'
      });
    }

    try {
      const mappedCard = this.mappingService.mapJiraToTrello(jiraIssue, trelloLists);

      if (task.trelloId) {
        // Update existing Trello card
        await this.trelloConnector.updateCard(task.trelloId, mappedCard);
      } else {
        // Create new Trello card
        const defaultList = trelloLists[0];
        const newCard = await this.trelloConnector.createCard({
          ...mappedCard,
          idList: mappedCard.idList || defaultList.id
        });
        task.trelloId = newCard.id;
      }

      task.status = 'synced';
      task.syncStatus = 'synced';
      task.lastSyncedAt = new Date();
      task.errorMessage = undefined;
      
      await task.save();
    } catch (error) {
      task.status = 'error';
      task.syncStatus = 'error';
      task.errorMessage = error.message;
      await task.save();
      throw error;
    }
  }

  private async syncTrelloCardToJira(trelloCard: TrelloCard, trelloLists: any[]): Promise<void> {
    let task = await Task.findOne({ trelloId: trelloCard.id });

    if (!task) {
      task = new Task({
        trelloId: trelloCard.id,
        title: trelloCard.name,
        syncDirection: 'trello_to_jira',
        status: 'pending'
      });
    }

    try {
      const mappedIssue = this.mappingService.mapTrelloToJira(trelloCard, trelloLists);

      if (task.jiraId) {
        // Update existing Jira issue
        await this.jiraConnector.updateIssue(task.jiraId, mappedIssue.fields);
      } else {
        // Create new Jira issue
        const newIssue = await this.jiraConnector.createIssue({
          summary: mappedIssue.fields.summary,
          description: mappedIssue.fields.description,
          issuetype: { name: 'Task' } // Default to Task type
        });
        task.jiraId = newIssue.key;
      }

      task.status = 'synced';
      task.syncStatus = 'synced';
      task.lastSyncedAt = new Date();
      task.errorMessage = undefined;
      
      await task.save();
    } catch (error) {
      task.status = 'error';
      task.syncStatus = 'error';
      task.errorMessage = error.message;
      await task.save();
      throw error;
    }
  }

  private async createSyncHistory(direction: 'jira_to_trello' | 'trello_to_jira', result: SyncResult): Promise<void> {
    const history = new SyncHistory({
      userId: this.config.userId,
      syncType: 'manual',
      syncDirection: direction,
      status: result.success ? 'success' : (result.tasksErrored === result.tasksSynced ? 'failed' : 'partial'),
      tasksSynced: result.tasksSynced,
      tasksErrored: result.tasksErrored,
      errorMessages: result.errorMessages,
      startTime: new Date(Date.now() - result.duration),
      endTime: new Date(),
      duration: result.duration
    });

    await history.save();
  }

  async getSyncStatus(): Promise<{
    lastSync: Date | null;
    pendingTasks: number;
    erroredTasks: number;
    syncHistory: ISyncHistory[];
  }> {
    const [lastSyncHistory, pendingCount, erroredCount, recentHistory] = await Promise.all([
      SyncHistory.findOne({ userId: this.config.userId })
        .sort({ createdAt: -1 })
        .limit(1),
      Task.countDocuments({ syncStatus: 'pending' }),
      Task.countDocuments({ syncStatus: 'error' }),
      SyncHistory.find({ userId: this.config.userId })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    return {
      lastSync: lastSyncHistory?.createdAt || null,
      pendingTasks: pendingCount,
      erroredTasks: erroredCount,
      syncHistory: recentHistory
    };
  }
}