# docs/guides/getting-started.md

# Getting Started with Jira-Trello Agent

## Introduction

The Jira-Trello Agent allows you to synchronize tasks between Jira and Trello using natural language commands.

## Prerequisites

- Node.js 18+ installed
- MongoDB instance
- Jira account with API access
- Trello account with API access

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/jira-trello-agent.git
cd jira-trello-agent
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Start the server:
```bash
npm run dev
```

## Initial Configuration

### 1. Create User Configuration

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{
    "jiraConfig": {
      "domain": "your-domain.atlassian.net",
      "email": "your-email@domain.com",
      "apiToken": "your-jira-token",
      "projectKey": "PROJ"
    },
    "trelloConfig": {
      "apiKey": "your-trello-key",
      "apiToken": "your-trello-token",
      "boardId": "your-board-id"
    }
  }'
```

### 2. Test Connection

```bash
curl -X POST http://localhost:3000/api/config/test-connection \
  -H "x-user-id: your-user-id"
```

## Basic Usage

### Manual Sync

```bash
curl -X POST http://localhost:3000/api/sync/manual \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{"direction": "jira_to_trello"}'
```

### Natural Language Commands

```bash
curl -X POST http://localhost:3000/api/commands/execute \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{"command": "sync now"}'
```

## Common Commands

- `"sync now"` - Start immediate synchronization
- `"show status"` - Display sync status
- `"list pending tasks"` - Show unsynced tasks
- `"sync task TASK-123"` - Sync specific task

## Next Steps

1. Read the [API Documentation](http://localhost:3000/api-docs)
2. Configure [Custom Mappings](./sync-configuration.md)
3. Learn about [Commands](./commands-guide.md)
4. Set up [Automatic Sync](./automation.md)

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check API tokens and credentials
2. **Sync Errors**: Verify field mappings
3. **Auth Error**: Ensure `x-user-id` header is set

### Getting Help

- Check the error logs: `tail -f logs/error.log`
- Review API docs: http://localhost:3000/api-docs
- Submit issues on GitHub

## License

MIT