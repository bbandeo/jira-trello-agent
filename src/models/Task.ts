// src/models/Task.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  jiraId?: string;
  trelloId?: string;
  title: string;
  description?: string;
  status: string;
  assignee?: string;
  dueDate?: Date;
  lastSyncedAt: Date;
  syncStatus: 'pending' | 'synced' | 'error';
  syncDirection: 'jira_to_trello' | 'trello_to_jira';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  jiraId: { type: String, unique: true, sparse: true },
  trelloId: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, required: true },
  assignee: { type: String },
  dueDate: { type: Date },
  lastSyncedAt: { type: Date, default: Date.now },
  syncStatus: { 
    type: String, 
    enum: ['pending', 'synced', 'error'],
    default: 'pending'
  },
  syncDirection: {
    type: String,
    enum: ['jira_to_trello', 'trello_to_jira'],
    required: true
  },
  errorMessage: { type: String }
}, { timestamps: true });

export const Task = mongoose.model<ITask>('Task', TaskSchema);