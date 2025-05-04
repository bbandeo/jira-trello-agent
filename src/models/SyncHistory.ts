// src/models/SyncHistory.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncHistory extends Document {
  userId: string;
  syncType: 'manual' | 'automatic';
  syncDirection: 'jira_to_trello' | 'trello_to_jira';
  status: 'success' | 'partial' | 'failed';
  tasksSynced: number;
  tasksErrored: number;
  errorMessages: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
  createdAt: Date;
}

const SyncHistorySchema = new Schema<ISyncHistory>({
  userId: { type: String, required: true },
  syncType: {
    type: String,
    enum: ['manual', 'automatic'],
    required: true
  },
  syncDirection: {
    type: String,
    enum: ['jira_to_trello', 'trello_to_jira'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    required: true
  },
  tasksSynced: { type: Number, default: 0 },
  tasksErrored: { type: Number, default: 0 },
  errorMessages: [{ type: String }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true } // in milliseconds
}, { timestamps: true });

export const SyncHistory = mongoose.model<ISyncHistory>('SyncHistory', SyncHistorySchema);