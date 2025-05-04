// src/config/index.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/jira-trello-agent'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs'
  },
  
  sync: {
    defaultFrequency: process.env.DEFAULT_SYNC_FREQUENCY || 'daily',
    defaultDirection: process.env.DEFAULT_SYNC_DIRECTION || 'jira_to_trello'
  }
} as const;

// Validation
const requiredEnvVars = ['MONGODB_URI'];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Required environment variable ${varName} is missing`);
  }
});