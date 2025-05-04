# Jira-Trello Sync Agent - Backend Architecture

## Overview

This is the backend service for a Jira-Trello synchronization agent with AI-powered text interpretation capabilities. The backend handles bidirectional synchronization between Jira and Trello, processes natural language commands, and provides APIs for the frontend interface.

## Architecture

Backend Service
├── API Gateway (Express.js)
├── Sync Engine
│   ├── Jira Connector
│   ├── Trello Connector
│   └── Mapping Engine
├── Text Processor (Natural Language)
├── Job Scheduler (Cron-based)
└── Database (MongoDB)
## Key Components

### 1. API Layer
- RESTful endpoints for sync operations
- WebSocket for real-time status updates
- Authentication & authorization (OAuth 2.0)
- Rate limiting and error handling

### 2. Sync Engine
- **Jira Connector**: Interfaces with Jira REST API v3
- **Trello Connector**: Interfaces with Trello REST API
- **Mapping Engine**: Handles field mapping between platforms
- **Conflict Resolution**: Manages sync conflicts with configurable rules

### 3. Text Processor
- Natural language command parsing
- Entity recognition (task IDs, project names)
- Predefined command templates
- Command validation and execution

### 4. Database Schema
```javascript
{
  "syncConfigs": {
    "userId": String,
    "jiraConfig": Object,
    "trelloConfig": Object,
    "mappings": Array,
    "schedule": String
  },
  "syncLogs": {
    "timestamp": Date,
    "status": String,
    "errors": Array,
    "items": Number
  }
}
```
## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **Message Queue**: Bull (Redis-based)
- **Testing**: Jest
- **API Docs**: Swagger/OpenAPI

## Environment Variables

```env
NODE_ENV=production
MONGODB_URI=mongodb://...
JIRA_API_KEY=xxx
TRELLO_API_KEY=xxx
REDIS_URL=redis://...
APP_SECRET=xxx
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## API Documentation

Available at `/api-docs` when running the server. Includes all endpoints for:
- Sync management
- Configuration
- Text command processing
- Status monitoring

## Security

- OAuth 2.0 authentication for Jira/Trello
- JWT for API authentication
- Input sanitization and validation
- Rate limiting
- CORS configuration

## Deployment

Designed for containerized deployment with Docker/Kubernetes. Includes:
- Dockerfile for container builds
- Health check endpoints
- Graceful shutdown handling
- Environment-based configuration

## License

MIT License



# DEV


# Jira-Trello Agent Backend

Backend service for the Jira-Trello synchronization agent with natural language command support.

## Features

- Bidirectional synchronization between Jira and Trello
- Natural language command parsing
- Automatic and manual sync capabilities
- Field and status mapping configuration
- Scheduled synchronization (daily/hourly)
- Comprehensive error handling and logging
- REST API for frontend integration

## Tech Stack

- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Natural library for NLP
- Winston for logging
- Jest for testing

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── sync.routes.ts
│   │   │   ├── commands.routes.ts
│   │   │   └── config.routes.ts
│   │   └── index.ts
│   ├── connectors/
│   │   ├── JiraConnector.ts
│   │   └── TrelloConnector.ts
│   ├── models/
│   │   ├── Task.ts
│   │   ├── SyncConfig.ts
│   │   └── SyncHistory.ts
│   ├── services/
│   │   ├── SyncService.ts
│   │   ├── MappingService.ts
│   │   └── CommandParser.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── error-handler.ts
│   │   └── scheduler.ts
│   ├── config/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   └── server.ts
├── tests/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start MongoDB:
```bash
docker run -d -p 27017:27017 mongo:latest
```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Configuration
- `GET /api/config` - Get user configuration
- `POST /api/config` - Create/update configuration
- `PUT /api/config/mappings` - Update field mappings
- `POST /api/config/test-connection` - Test Jira/Trello connection
- `GET /api/config/default-mappings` - Get default mappings

### Synchronization
- `POST /api/sync/manual` - Start manual sync
- `POST /api/sync/task/:taskId` - Sync single task
- `GET /api/sync/status` - Get sync status
- `GET /api/sync/history` - Get sync history
- `GET /api/sync/unsynced` - Get unsynced tasks

### Commands
- `POST /api/commands/execute` - Execute natural language command
- `GET /api/commands/suggestions` - Get command suggestions

## Natural Language Commands

Supported commands include:
- "Sincronizar ahora" / "Sync now"
- "Sincronizar tarea TASK-123" / "Sync task TASK-123"
- "Mostrar estado" / "Show status"
- "Listar tareas pendientes" / "List pending tasks"
- "Listar errores" / "List errors"

## Configuration Options

### Sync Configuration
```json
{
  "jiraConfig": {
    "domain": "your-domain.atlassian.net",
    "email": "user@domain.com",
    "apiToken": "your-api-token",
    "projectKey": "PROJ"
  },
  "trelloConfig": {
    "apiKey": "your-api-key",
    "apiToken": "your-token",
    "boardId": "board-id"
  },
  "syncFrequency": "daily",
  "syncDirection": "bidirectional"
}
```

### Field Mappings
```json
{
  "fieldMappings": [
    { "jiraField": "summary", "trelloField": "name" },
    { "jiraField": "description", "trelloField": "desc" }
  ]
}
```

### Status Mappings
```json
{
  "statusMappings": [
    { "jiraStatus": "To Do", "trelloStatus": "To Do" },
    { "jiraStatus": "In Progress", "trelloStatus": "Doing" }
  ]
}
```

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Environment Variables

See `.env.example` for all required environment variables.

## License

MIT