// src/connectors/JiraConnector.ts
import axios, { AxiosInstance } from 'axios';
import { logger } from '@/utils/logger';

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    duedate?: string;
    updated: string;
  };
}

export interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export class JiraConnector {
  private client: AxiosInstance;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `https://${config.domain}/rest/api/3`,
      auth: {
        username: config.email,
        password: config.apiToken
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  async getIssuesByProject(): Promise<JiraIssue[]> {
    try {
      const response = await this.client.get('/search', {
        params: {
          jql: `project=${this.config.projectKey} ORDER BY updated DESC`,
          maxResults: 50
        }
      });
      return response.data.issues;
    } catch (error) {
      logger.error('Error fetching Jira issues:', error);
      throw error;
    }
  }

  async createIssue(issue: {
    summary: string;
    description?: string;
    issuetype: { name: string };
    priority?: { name: string };
  }): Promise<JiraIssue> {
    try {
      const response = await this.client.post('/issue', {
        fields: {
          project: { key: this.config.projectKey },
          ...issue
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error creating Jira issue:', error);
      throw error;
    }
  }

  async updateIssue(issueKey: string, fields: Record<string, any>): Promise<void> {
    try {
      await this.client.put(`/issue/${issueKey}`, {
        fields: fields
      });
    } catch (error) {
      logger.error(`Error updating Jira issue ${issueKey}:`, error);
      throw error;
    }
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Jira issue ${issueKey}:`, error);
      throw error;
    }
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/transitions`, {
        transition: { id: transitionId }
      });
    } catch (error) {
      logger.error(`Error transitioning Jira issue ${issueKey}:`, error);
      throw error;
    }
  }

  async getTransitions(issueKey: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/issue/${issueKey}/transitions`);
      return response.data.transitions;
    } catch (error) {
      logger.error(`Error fetching transitions for issue ${issueKey}:`, error);
      throw error;
    }
  }
}