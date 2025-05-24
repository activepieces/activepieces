import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export class SmartSuiteClient {
  private baseUrl = 'https://app.smartsuite.com/api/v1';

  constructor(private apiKey: string, private workspaceId: string) {}

  async makeRequest<T>({
    method,
    path,
    data,
    params,
  }: {
    method: HttpMethod;
    path: string;
    data?: Record<string, unknown>;
    params?: Record<string, string>;
  }) {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Authorization': `Token ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    // Add workspace ID if available
    if (this.workspaceId) {
      headers['ACCOUNT-ID'] = this.workspaceId;
    }

    const response = await httpClient.sendRequest<T>({
      method,
      url,
      headers,
      body: data,
      queryParams: params,
    });

    return response.body;
  }

  async listApps() {
    return this.makeRequest<any[]>({
      method: HttpMethod.GET,
      path: '/applications',
    });
  }

  async getApp(appId: string) {
    return this.makeRequest({
      method: HttpMethod.GET,
      path: `/applications/${appId}`,
    });
  }

  async createRecord(appId: string, data: Record<string, unknown>) {
    return this.makeRequest({
      method: HttpMethod.POST,
      path: `/applications/${appId}/records/`,
      data,
    });
  }

  async updateRecord(appId: string, recordId: string, data: Record<string, unknown>) {
    return this.makeRequest({
      method: HttpMethod.PATCH,
      path: `/applications/${appId}/records/${recordId}`,
      data,
    });
  }

  async getRecord(appId: string, recordId: string) {
    return this.makeRequest({
      method: HttpMethod.GET,
      path: `/applications/${appId}/records/${recordId}`,
    });
  }

  async findRecords(appId: string, params: Record<string, string>, filters?: Record<string, unknown>) {
    // Convert polling parameters to query params or request body as needed
    const queryParams: Record<string, string> = {};
    const requestBody: Record<string, unknown> = {};

    // Add limit, offset, all to query params if provided
    if (params['limit']) queryParams['limit'] = params['limit'];
    if (params['offset']) queryParams['offset'] = params['offset'];
    if (params['all']) queryParams['all'] = params['all'];

    // Add sort to request body
    if (params['sort_field']) {
      requestBody['sort'] = [params['sort_field']];
    }

    // Add filter object if provided or create one based on params
    if (filters) {
      requestBody['filter'] = filters;
    } else {
      // Create filters based on created_after or updated_after
      if (params['created_after'] || params['updated_after']) {
        const filterObj: Record<string, unknown> = {};

        if (params['created_after']) {
          filterObj['created_at'] = {
            'gte': params['created_after']
          };
        }

        if (params['updated_after']) {
          filterObj['updated_at'] = {
            'gte': params['updated_after']
          };
        }

        if (Object.keys(filterObj).length > 0) {
          requestBody['filter'] = filterObj;
        }
      }
    }

    return this.makeRequest({
      method: HttpMethod.POST,
      path: `/applications/${appId}/records/list/`,
      params: queryParams,
      data: requestBody,
    });
  }

  async attachFileToRecord(appId: string, recordId: string, fieldSlug: string, fileUrl: string) {
    // Based on the API documentation screenshot, we need to use PATCH to attach a file
    return this.makeRequest({
      method: HttpMethod.PATCH,
      path: `/applications/${appId}/records/${recordId}`,
      data: {
        [fieldSlug]: [fileUrl],
        "id": recordId
      },
    });
  }
}
