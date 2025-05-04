/backend
  /src
    /connectors
      - JiraConnector.ts
      - TrelloConnector.ts
    /services
      - SyncService.ts
      - MappingService.ts
      - CommandParser.ts
    /models
      - Task.ts
      - SyncConfig.ts
      - SyncHistory.ts
    /api
      /routes
        - sync.routes.ts
        - commands.routes.ts
        - config.routes.ts
      - index.ts
    /utils
      - logger.ts
      - error-handler.ts
    /config
      - index.ts
    /types
      - index.ts
    - server.ts
  /tests
    /unit
    /integration
  - package.json
  - tsconfig.json
  - .env.example
  - README.md