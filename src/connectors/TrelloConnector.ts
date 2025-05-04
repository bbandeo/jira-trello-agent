// src/connectors/TrelloConnector.ts
import axios, { AxiosInstance } from 'axios';
import { logger } from '@/utils/logger';

export interface TrelloCard {
  id: string;
  name: string;
  desc?: string;
  due?: string;
  idList: string;
  idMembers: string[];
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  dateLastActivity: string;
}

export interface TrelloList {
  id: string;
  name: string;
  pos: number;
}

export interface TrelloConfig {
  apiKey: string;
  apiToken: string;
  boardId: string;
}

export class TrelloConnector {
  private client: AxiosInstance;
  private config: TrelloConfig;

  constructor(config: TrelloConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://api.trello.com/1',
      params: {
        key: config.apiKey,
        token: config.apiToken
      }
    });
  }

  async getCardsByBoard(): Promise<TrelloCard[]> {
    try {
      const response = await this.client.get(`/boards/${this.config.boardId}/cards`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching Trello cards:', error);
      throw error;
    }
  }

  async createCard(params: {
    name: string;
    desc?: string;
    idList: string;
    due?: string;
    idMembers?: string[];
  }): Promise<TrelloCard> {
    try {
      const response = await this.client.post('/cards', params);
      return response.data;
    } catch (error) {
      logger.error('Error creating Trello card:', error);
      throw error;
    }
  }

  async updateCard(cardId: string, params: Record<string, any>): Promise<TrelloCard> {
    try {
      const response = await this.client.put(`/cards/${cardId}`, params);
      return response.data;
    } catch (error) {
      logger.error(`Error updating Trello card ${cardId}:`, error);
      throw error;
    }
  }

  async getCard(cardId: string): Promise<TrelloCard> {
    try {
      const response = await this.client.get(`/cards/${cardId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching Trello card ${cardId}:`, error);
      throw error;
    }
  }

  async getLists(): Promise<TrelloList[]> {
    try {
      const response = await this.client.get(`/boards/${this.config.boardId}/lists`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching Trello lists:', error);
      throw error;
    }
  }

  async getListByName(name: string): Promise<TrelloList | null> {
    try {
      const lists = await this.getLists();
      return lists.find(list => list.name.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
      logger.error(`Error finding Trello list ${name}:`, error);
      throw error;
    }
  }

  async getBoardMembers(): Promise<any[]> {
    try {
      const response = await this.client.get(`/boards/${this.config.boardId}/members`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching Trello board members:', error);
      throw error;
    }
  }
}