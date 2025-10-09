import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import * as fs from 'fs';
import FormData from 'form-data';
import {
  ServiceNowRecord,
  AttachmentMeta,
  EventList,
  WebhookSubscription,
  NotSupported,
  ServiceNowClientOptions,
  TriggerEvent,
} from './types';

export class ServiceNowClient {
  private baseURL: string;
  private auth: { type: 'basic' | 'bearer'; username?: string; password?: string; token?: string };

  constructor(options: ServiceNowClientOptions) {
    this.baseURL = options.instanceUrl.replace(/\/$/, '');
    this.auth = options.auth;

    if (this.auth.type === 'basic' && (!this.auth.username || !this.auth.password)) {
      throw new Error('Username and password are required for basic authentication');
    }
    if (this.auth.type === 'bearer' && !this.auth.token) {
      throw new Error('Token is required for bearer authentication');
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.auth.type === 'basic') {
      const credentials = Buffer.from(`${this.auth.username}:${this.auth.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (this.auth.type === 'bearer') {
      headers['Authorization'] = `Bearer ${this.auth.token}`;
    }

    return headers;
  }

  private async makeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...customHeaders };

    let attempt = 0;
    const maxAttempts = 3;
    const baseDelay = 500;

    while (attempt < maxAttempts) {
      try {
        const response = await httpClient.sendRequest({
          method,
          url,
          headers,
          body,
          timeout: 30000,
          retries: 0,
        });

        return response.body as T;
      } catch (error: any) {
        attempt++;
        
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers?.['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * baseDelay;
          
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`Rate-limited, retry after ${retryAfter || 'unknown'} seconds`);
        }

        if (attempt < maxAttempts && (error.response?.status >= 500 || !error.response)) {
          const delay = Math.pow(2, attempt) * baseDelay;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw this.mapError(error);
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  private mapError(error: any): Error {
    if (!error.response) {
      return new Error('Network error occurred');
    }

    const status = error.response.status;
    const data = error.response.body || error.response.data;

    switch (status) {
      case 401:
        return new Error('Invalid credentials');
      case 403:
        return new Error('Forbidden: insufficient permissions');
      case 404:
        return new Error('Not found');
      case 422:
      case 400:
        const details = data?.error?.message || data?.message || 'Invalid request data';
        return new Error(`Validation error: ${details}`);
      case 429:
        const retryAfter = error.response.headers?.['retry-after'];
        const retryMsg = retryAfter ? ` retry after ${retryAfter} seconds` : '';
        return new Error(`Rate-limited,${retryMsg}`);
      default:
        return new Error(data?.error?.message || data?.message || `ServiceNow server error (${status})`);
    }
  }

  async getRecord(table: string, sys_id: string): Promise<ServiceNowRecord> {
    const endpoint = `/api/now/table/${table}/${sys_id}`;
    const response = await this.makeRequest<{ result: ServiceNowRecord }>(HttpMethod.GET, endpoint);
    return response.result;
  }

  async createRecord(table: string, fields: Record<string, any>): Promise<ServiceNowRecord> {
    const endpoint = `/api/now/table/${table}`;
    const response = await this.makeRequest<{ result: ServiceNowRecord }>(HttpMethod.POST, endpoint, fields);
    return response.result;
  }

  async updateRecord(table: string, sys_id: string, fields: Record<string, any>): Promise<ServiceNowRecord> {
    const endpoint = `/api/now/table/${table}/${sys_id}`;
    const response = await this.makeRequest<{ result: ServiceNowRecord }>(HttpMethod.PUT, endpoint, fields);
    return response.result;
  }

  async deleteRecord(table: string, sys_id: string): Promise<void> {
    const endpoint = `/api/now/table/${table}/${sys_id}`;
    await this.makeRequest<void>(HttpMethod.DELETE, endpoint);
  }

  async findRecord(
    table: string,
    query: string,
    params?: { limit?: number; fields?: string[] }
  ): Promise<ServiceNowRecord[]> {
    const endpoint = `/api/now/table/${table}`;
    const queryParams: Record<string, string> = {
      sysparm_query: query,
    };

    if (params?.limit) {
      queryParams['sysparm_limit'] = params.limit.toString();
    }
    if (params?.fields) {
      queryParams['sysparm_fields'] = params.fields.join(',');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseURL}${endpoint}`,
      headers: this.getHeaders(),
      queryParams,
      timeout: 30000,
      retries: 3,
    });

    const data = response.body as { result: ServiceNowRecord[] };
    return data.result;
  }

  async attachFile(
    table: string,
    sys_id: string,
    filePath?: string,
    fileBase64?: string,
    filename?: string,
    contentType?: string
  ): Promise<AttachmentMeta> {
    const formData = new FormData();
    
    if (filePath) {
      const fileStream = fs.createReadStream(filePath);
      formData.append('file', fileStream, {
        filename: filename || 'attachment',
        contentType: contentType || 'application/octet-stream',
      });
    } else if (fileBase64) {
      const buffer = Buffer.from(fileBase64.replace(/^data:[^;]+;base64,/, ''), 'base64');
      formData.append('file', buffer, {
        filename: filename || 'attachment',
        contentType: contentType || 'application/octet-stream',
      });
    } else {
      throw new Error('Either filePath or fileBase64 must be provided');
    }

    formData.append('table_name', table);
    formData.append('table_sys_id', sys_id);

    const headers = {
      'Authorization': this.getHeaders()['Authorization'],
      ...formData.getHeaders(),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${this.baseURL}/api/now/attachment/file`,
      headers,
      body: formData,
      timeout: 60000,
      retries: 3,
    });

    const data = response.body as { result: AttachmentMeta };
    return data.result;
  }

  async listAttachments(table: string, sys_id: string): Promise<AttachmentMeta[]> {
    const endpoint = `/api/now/attachment`;
    const queryParams = {
      sysparm_query: `table_name=${table}^table_sys_id=${sys_id}`,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseURL}${endpoint}`,
      headers: this.getHeaders(),
      queryParams,
      timeout: 30000,
      retries: 3,
    });

    const data = response.body as { result: AttachmentMeta[] };
    return data.result;
  }

  async getAttachment(_table: string, _sys_id: string, attachment_sys_id: string): Promise<Buffer> {
    const endpoint = `/api/now/attachment/${attachment_sys_id}/file`;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseURL}${endpoint}`,
      headers: this.getHeaders(),
      responseType: 'arraybuffer',
      timeout: 60000,
      retries: 3,
    });

    return Buffer.from(response.body as ArrayBuffer);
  }

  async pollTableEvents(
    table: string,
    since?: string,
    limit?: number,
    params?: Record<string, any>
  ): Promise<EventList> {
    const endpoint = `/api/now/table/${table}`;
    const queryParams: Record<string, string> = {};

    if (since) {
      queryParams['sysparm_query'] = `sys_updated_on>${since}`;
    }
    if (limit) {
      queryParams['sysparm_limit'] = limit.toString();
    }
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        queryParams[key] = String(value);
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseURL}${endpoint}`,
      headers: this.getHeaders(),
      queryParams,
      timeout: 30000,
      retries: 3,
    });

    const data = response.body as { result: ServiceNowRecord[] };
    
    const events: TriggerEvent[] = data.result.map(record => ({
      eventId: `${record['sys_id']}_${record['sys_updated_on']}`,
      table,
      sys_id: record['sys_id'],
      operation: since ? 'update' : 'create',
      fields: record,
      timestamp: record['sys_updated_on'] || new Date().toISOString(),
      raw: record,
    }));

    return {
      events,
      hasMore: data.result.length === (limit || 100),
      nextCursor: events.length > 0 ? events[events.length - 1].timestamp : undefined,
    };
  }

  async subscribeWebhook(
    _table: string,
    _callbackUrl: string,
    _events: string[]
  ): Promise<WebhookSubscription | NotSupported> {
    throw new NotSupported('Webhook subscriptions require manual configuration in ServiceNow Business Rules or IntegrationHub');
  }

  async unsubscribeWebhook(_subscriptionId: string): Promise<void | NotSupported> {
    throw new NotSupported('Webhook unsubscription requires manual configuration in ServiceNow Business Rules or IntegrationHub');
  }

  async getTables(): Promise<Array<{ label: string; value: string }>> {
    const endpoint = '/api/now/table/sys_db_object';
    const queryParams = {
      sysparm_query: 'nameNOT LIKEts_^nameNOT LIKEv_^nameNOT LIKEpa_^super_class.nameISEMPTY',
      sysparm_fields: 'name,label',
      sysparm_limit: '1000',
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${this.baseURL}${endpoint}`,
        headers: this.getHeaders(),
        queryParams,
        timeout: 30000,
        retries: 3,
      });

      const data = response.body as { result: Array<{ name: string; label: string }> };
      return data.result.map(table => ({
        label: `${table.label} (${table.name})`,
        value: table.name,
      }));
    } catch {
      return [
        { label: 'Incident (incident)', value: 'incident' },
        { label: 'Change Request (change_request)', value: 'change_request' },
        { label: 'Problem (problem)', value: 'problem' },
        { label: 'Service Request (sc_request)', value: 'sc_request' },
        { label: 'Task (task)', value: 'task' },
        { label: 'User (sys_user)', value: 'sys_user' },
        { label: 'Group (sys_user_group)', value: 'sys_user_group' },
        { label: 'Configuration Item (cmdb_ci)', value: 'cmdb_ci' },
      ];
    }
  }

  async getRecordsForDropdown(table: string, limit = 50): Promise<Array<{ label: string; value: string }>> {
    const endpoint = `/api/now/table/${table}`;
    const queryParams = {
      sysparm_limit: limit.toString(),
      sysparm_fields: 'sys_id,number,name,short_description,title',
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${this.baseURL}${endpoint}`,
        headers: this.getHeaders(),
        queryParams,
        timeout: 30000,
        retries: 3,
      });

      const data = response.body as { result: ServiceNowRecord[] };
      return data.result.map(record => {
        const displayName = record['number'] || record['name'] || record['short_description'] || record['title'] || record['sys_id'];
        return {
          label: `${displayName} (${record['sys_id']})`,
          value: record['sys_id'],
        };
      });
    } catch {
      return [];
    }
  }
}