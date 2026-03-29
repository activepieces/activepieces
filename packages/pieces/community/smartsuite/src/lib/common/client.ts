import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { API_BASE_URL } from '../auth';

/**
 * SmartSuite API Client
 */
export class SmartSuiteClient {
  private apiToken: string;
  private workspaceId: string;

  constructor(apiToken: string, workspaceId: string) {
    this.apiToken = apiToken;
    this.workspaceId = workspaceId;
  }

  private getHeaders() {
    return {
      'Authorization': `Token ${this.apiToken}`,
      'ACCOUNT-ID': this.workspaceId,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List all solutions
   */
  async listSolutions() {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.GET,
      url: `${API_BASE_URL}/api/v1/solutions/`,
      headers: this.getHeaders(),
    });
    return response.body;
  }

  /**
   * List all tables
   */
  async listTables() {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.GET,
      url: `${API_BASE_URL}/api/v1/applications/`,
      headers: this.getHeaders(),
    });
    return response.body;
  }

  /**
   * List records from a table
   */
  async listRecords(tableId: string, limit: number = 100, offset: number = 0) {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.GET,
      url: `${API_BASE_URL}/api/v1/applications/${tableId}/records/`,
      headers: this.getHeaders(),
      queryParams: { limit: String(limit), offset: String(offset) },
    });
    return response.body;
  }

  /**
   * Get a specific record
   */
  async getRecord(tableId: string, recordId: string) {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.GET,
      url: `${API_BASE_URL}/api/v1/applications/${tableId}/records/${recordId}/`,
      headers: this.getHeaders(),
    });
    return response.body;
  }

  /**
   * Create a record - fields at top level, not wrapped
   */
  async createRecord(tableId: string, fields: Record<string, any>) {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${API_BASE_URL}/api/v1/applications/${tableId}/records/`,
      headers: this.getHeaders(),
      body: fields,
    });
    return response.body;
  }

  /**
   * Update a record - fields at top level, not wrapped
   */
  async updateRecord(tableId: string, recordId: string, fields: Record<string, any>) {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.PATCH,
      url: `${API_BASE_URL}/api/v1/applications/${tableId}/records/${recordId}/`,
      headers: this.getHeaders(),
      body: fields,
    });
    return response.body;
  }

  /**
   * Delete a record
   */
  async deleteRecord(tableId: string, recordId: string) {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.DELETE,
      url: `${API_BASE_URL}/api/v1/applications/${tableId}/records/${recordId}/`,
      headers: this.getHeaders(),
    });
    return response.body;
  }

  /**
   * Search records
   */
  async searchRecords(tableId: string, query: Record<string, any>) {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${API_BASE_URL}/api/v1/applications/${tableId}/records/list/`,
      headers: this.getHeaders(),
      body: query,
    });
    return response.body;
  }
}
