// src/services/CommandParser.ts
import natural from 'natural';
import { logger } from '@/utils/logger';

export interface CommandResult {
  action: 'sync' | 'status' | 'list' | 'configure' | 'error';
  params: {
    direction?: 'jira_to_trello' | 'trello_to_jira';
    taskId?: string;
    entityType?: 'tasks' | 'pending' | 'errors';
    errorCode?: string;
    errorMessage?: string;
  };
}

export class CommandParser {
  private tokenizer: natural.Tokenizer;
  private stemmer: natural.PorterStemmer;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  parseCommand(command: string): CommandResult {
    const tokens = this.tokenizer.tokenize(command.toLowerCase()) || [];
    const stemmedTokens = tokens.map(token => this.stemmer.stem(token));

    logger.debug('Parsing command:', { original: command, tokens, stemmedTokens });

    // Sync commands
    if (this.containsWords(stemmedTokens, ['sync', 'sincroniz'])) {
      return this.parseSyncCommand(tokens, stemmedTokens);
    }

    // Status commands
    if (this.containsWords(stemmedTokens, ['status', 'estado', 'show', 'mostrar'])) {
      return this.parseStatusCommand(tokens, stemmedTokens);
    }

    // List commands
    if (this.containsWords(stemmedTokens, ['list', 'lista', 'show', 'listar'])) {
      return this.parseListCommand(tokens, stemmedTokens);
    }

    // Configure commands
    if (this.containsWords(stemmedTokens, ['config', 'configur', 'setup'])) {
      return this.parseConfigureCommand(tokens, stemmedTokens);
    }

    // Unknown command
    return {
      action: 'error',
      params: {
        errorCode: 'UNKNOWN_COMMAND',
        errorMessage: `No pude entender el comando: "${command}". Intenta con: "sincronizar ahora", "mostrar estado", "listar tareas pendientes"`
      }
    };
  }

  private parseSyncCommand(tokens: string[], stemmedTokens: string[]): CommandResult {
    // Check for immediate sync
    if (this.containsWords(tokens, ['now', 'ahora', 'immediately', 'inmediatamente'])) {
      return { action: 'sync', params: {} };
    }

    // Check for specific task sync
    const taskId = this.extractId(tokens);
    if (taskId) {
      const direction = this.extractDirection(tokens, stemmedTokens);
      return { action: 'sync', params: { taskId, direction } };
    }

    // Check for direction-specific sync
    const direction = this.extractDirection(tokens, stemmedTokens);
    if (direction) {
      return { action: 'sync', params: { direction } };
    }

    // Default sync action
    return { action: 'sync', params: {} };
  }

  private parseStatusCommand(tokens: string[], stemmedTokens: string[]): CommandResult {
    // Check for sync status
    if (this.containsWords(stemmedTokens, ['sync', 'sincroniz'])) {
      return { action: 'status', params: {} };
    }

    return { action: 'status', params: {} };
  }

  private parseListCommand(tokens: string[], stemmedTokens: string[]): CommandResult {
    // List pending tasks
    if (this.containsWords(stemmedTokens, ['pending', 'pendient'])) {
      return { action: 'list', params: { entityType: 'pending' } };
    }

    // List errored tasks
    if (this.containsWords(stemmedTokens, ['error', 'failed', 'fallido'])) {
      return { action: 'list', params: { entityType: 'errors' } };
    }

    // List all tasks
    return { action: 'list', params: { entityType: 'tasks' } };
  }

  private parseConfigureCommand(tokens: string[], stemmedTokens: string[]): CommandResult {
    return { action: 'configure', params: {} };
  }

  private containsWords(tokens: string[], words: string[]): boolean {
    return words.some(word => tokens.includes(word));
  }

  private extractId(tokens: string[]): string | undefined {
    // Look for patterns like "task-123", "ISSUE-456", etc.
    const idPattern = /^[A-Z]+-\d+$|^[a-f0-9]{24}$/;
    return tokens.find(token => idPattern.test(token));
  }

  private extractDirection(tokens: string[], stemmedTokens: string[]): 'jira_to_trello' | 'trello_to_jira' | undefined {
    const hasJira = this.containsWords(tokens, ['jira']);
    const hasTrello = this.containsWords(tokens, ['trello']);
    const toPattern = this.containsWords(tokens, ['to', 'a', 'hacia']);

    if (hasJira && hasTrello && toPattern) {
      const jiraIndex = tokens.indexOf('jira');
      const trelloIndex = tokens.indexOf('trello');
      
      if (jiraIndex < trelloIndex) {
        return 'jira_to_trello';
      } else {
        return 'trello_to_jira';
      }
    }

    return undefined;
  }

  getSuggestions(partial: string): string[] {
    const normalizedPartial = partial.toLowerCase();
    const commonCommands = [
      "sincronizar ahora",
      "sincronizar tarea",
      "mostrar estado",
      "listar tareas pendientes",
      "listar errores",
      "mostrar estado de sincronización",
      "configurar",
      "sync now",
      "sync task",
      "show status",
      "list pending tasks",
      "list errors",
      "configure"
    ];

    return commonCommands.filter(cmd => 
      cmd.toLowerCase().includes(normalizedPartial)
    ).slice(0, 5);
  }
}