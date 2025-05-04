// src/models/SyncConfig.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IFieldMapping {
  jiraField: string;
  trelloField: string;
}

export interface IStatusMapping {
  jiraStatus: string;
  trelloStatus: string;
}

export interface ISyncConfig extends Document {
  userId: string;
  jiraConfig: {
    domain: string;
    email: string;
    apiToken: string;
    projectKey: string;
  };
  trelloConfig: {
    apiKey: string;
    apiToken: string;
    boardId: string;
  };
  fieldMappings: IFieldMapping[];
  statusMappings: IStatusMapping[];
  syncFrequency: 'manual' | 'daily' | 'hourly';
  syncDirection: 'jira_to_trello' | 'trello_to_jira' | 'bidirectional';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SyncConfigSchema = new Schema<ISyncConfig>({
  userId: { type: String, required: true, unique: true },
  jiraConfig: {
    domain: { type: String, required: true },
    email: { type: String, required: true },
    apiToken: { type: String, required: true },
    projectKey: { type: String, required: true }
  },
  trelloConfig: {
    apiKey: { type: String, required: true },
    apiToken: { type: String, required: true },
    boardId: { type: String, required: true }
  },
  fieldMappings: [{
    jiraField: { type: String, required: true },
    trelloField: { type: String, required: true }
  }],
  statusMappings: [{
    jiraStatus: { type: String, required: true },
    trelloStatus: { type: String, required: true }
  }],
  syncFrequency: {
    type: String,
    enum: ['manual', 'daily', 'hourly'],
    default: 'daily'
  },
  syncDirection: {
    type: String,
    enum: ['jira_to_trello', 'trello_to_jira', 'bidirectional'],
    default: 'jira_to_trello'
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SyncConfig = mongoose.model<ISyncConfig>('SyncConfig', SyncConfigSchema);