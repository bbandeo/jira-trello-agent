// src/services/MappingService.ts
import { JiraIssue } from '@/connectors/JiraConnector';
import { TrelloCard, TrelloList } from '@/connectors/TrelloConnector';
import { ISyncConfig, IFieldMapping, IStatusMapping } from '@/models/SyncConfig';

export class MappingService {
  private config: ISyncConfig;

  constructor(config: ISyncConfig) {
    this.config = config;
  }

  mapJiraToTrello(jiraIssue: JiraIssue, trelloLists: TrelloList[]): Partial<TrelloCard> {
    const mappedCard: any = {};

    // Map title
    mappedCard.name = jiraIssue.fields.summary;

    // Map description
    if (jiraIssue.fields.description) {
      mappedCard.desc = `${jiraIssue.fields.description}\n\n[Jira Issue: ${jiraIssue.key}]`;
    }

    // Map due date
    if (jiraIssue.fields.duedate) {
      mappedCard.due = jiraIssue.fields.duedate;
    }

    // Map status to list
    const statusMapping = this.getStatusMapping(jiraIssue.fields.status.name, 'jira');
    if (statusMapping) {
      const targetList = trelloLists.find(list => 
        list.name.toLowerCase() === statusMapping.trelloStatus.toLowerCase()
      );
      if (targetList) {
        mappedCard.idList = targetList.id;
      }
    }

    // Map custom fields
    for (const fieldMapping of this.config.fieldMappings) {
      const jiraValue = this.getJiraFieldValue(jiraIssue, fieldMapping.jiraField);
      if (jiraValue) {
        // Map to appropriate Trello field
        if (fieldMapping.trelloField === 'labels') {
          mappedCard.labels = [{ name: jiraValue }];
        }
      }
    }

    return mappedCard;
  }

  mapTrelloToJira(trelloCard: TrelloCard, trelloLists: TrelloList[]): Partial<JiraIssue> {
    const mappedIssue: any = {
      fields: {}
    };

    // Map title
    mappedIssue.fields.summary = trelloCard.name;

    // Map description (remove Jira reference if exists)
    if (trelloCard.desc) {
      const descWithoutJiraRef = trelloCard.desc.replace(/\[Jira Issue:.*\]$/, '').trim();
      mappedIssue.fields.description = descWithoutJiraRef;
    }

    // Map due date
    if (trelloCard.due) {
      mappedIssue.fields.duedate = trelloCard.due.split('T')[0]; // Only date, no time
    }

    // Map list to status
    const currentList = trelloLists.find(list => list.id === trelloCard.idList);
    if (currentList) {
      const statusMapping = this.getStatusMapping(currentList.name, 'trello');
      if (statusMapping) {
        mappedIssue.fields.status = { name: statusMapping.jiraStatus };
      }
    }

    // Map custom fields
    for (const fieldMapping of this.config.fieldMappings) {
      const trelloValue = this.getTrelloFieldValue(trelloCard, fieldMapping.trelloField);
      if (trelloValue) {
        mappedIssue.fields[fieldMapping.jiraField] = trelloValue;
      }
    }

    return mappedIssue;
  }

  private getStatusMapping(status: string, platform: 'jira' | 'trello'): IStatusMapping | undefined {
    if (platform === 'jira') {
      return this.config.statusMappings.find(mapping => 
        mapping.jiraStatus.toLowerCase() === status.toLowerCase()
      );
    } else {
      return this.config.statusMappings.find(mapping => 
        mapping.trelloStatus.toLowerCase() === status.toLowerCase()
      );
    }
  }

  private getJiraFieldValue(jiraIssue: JiraIssue, fieldName: string): any {
    // Handle nested field names (e.g., "assignee.displayName")
    const fieldParts = fieldName.split('.');
    let value: any = jiraIssue.fields;
    
    for (const part of fieldParts) {
      if (value && value[part] !== undefined) {
        value = value[part];
      } else {
        return null;
      }
    }
    
    return value;
  }

  private getTrelloFieldValue(trelloCard: TrelloCard, fieldName: string): any {
    if (fieldName === 'labels' && trelloCard.labels?.length > 0) {
      return trelloCard.labels[0].name;
    }
    return (trelloCard as any)[fieldName];
  }

  getDefaultFieldMappings(): IFieldMapping[] {
    return [
      { jiraField: 'summary', trelloField: 'name' },
      { jiraField: 'description', trelloField: 'desc' },
      { jiraField: 'duedate', trelloField: 'due' },
      { jiraField: 'assignee.displayName', trelloField: 'idMembers' }
    ];
  }

  getDefaultStatusMappings(): IStatusMapping[] {
    return [
      { jiraStatus: 'To Do', trelloStatus: 'To Do' },
      { jiraStatus: 'In Progress', trelloStatus: 'Doing' },
      { jiraStatus: 'Done', trelloStatus: 'Done' },
      { jiraStatus: 'Blocked', trelloStatus: 'Blocked' }
    ];
  }
}