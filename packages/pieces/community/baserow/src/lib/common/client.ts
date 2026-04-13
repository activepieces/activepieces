import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { BaserowField, BaserowTable } from './types';

function emptyValueFilter(
  accessor: (key: string) => unknown
): (key: string) => boolean {
  return (key: string) => {
    const val = accessor(key);
    return (
      val !== null &&
      val !== undefined &&
      (typeof val != 'string' || val.length > 0)
    );
  };
}

export function prepareQuery(request?: Record<string, unknown>): QueryParams {
  const params: QueryParams = {};
  if (!request) return params;
  Object.keys(request)
    .filter(emptyValueFilter((k) => request[k]))
    .forEach((k: string) => {
      params[k] = (request as Record<string, unknown>)[k]!.toString();
    });
  return params;
}

export class BaserowClient {
  constructor(
    private baseUrl: string,
    private authHeader: string
  ) {}

  static async getJwtToken(
    baseUrl: string,
    email: string,
    password: string
  ): Promise<string> {
    const res = await httpClient.sendRequest<{ token: string }>({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/user/token-auth/`,
      body: { email, password },
    });
    return res.body.token;
  }

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    url: string,
    query?: QueryParams,
    body?: object
  ): Promise<T> {
    const res = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}/api${url}`,
      headers: { Authorization: this.authHeader },
      queryParams: query,
      body,
    });
    return res.body;
  }
  async listTables(): Promise<BaserowTable[]> {
    return await this.makeRequest<BaserowTable[]>(
      HttpMethod.GET,
      `/database/tables/all-tables/`
    );
  }
  async listTableFields(table_id: number): Promise<BaserowField[]> {
    return await this.makeRequest<BaserowField[]>(
      HttpMethod.GET,
      `/database/fields/table/${table_id}/`
    );
  }
  async createRow(table_id: number, request: Record<string, unknown>) {
    return await this.makeRequest(
      HttpMethod.POST,
      `/database/rows/table/${table_id}/`,
      {
        user_field_names: 'true',
      },
      request
    );
  }
  async updateRow(
    table_id: number,
    row_id: number,
    request: Record<string, unknown>
  ) {
    return await this.makeRequest(
      HttpMethod.PATCH,
      `/database/rows/table/${table_id}/${row_id}/`,
      {
        user_field_names: 'true',
      },
      request
    );
  }
  async deleteRow(table_id: number, row_id: number) {
    return await this.makeRequest(
      HttpMethod.DELETE,
      `/database/rows/table/${table_id}/${row_id}/`
    );
  }
  async getRow(table_id: number, row_id: number) {
    return await this.makeRequest(
      HttpMethod.GET,
      `/database/rows/table/${table_id}/${row_id}/`,
      {
        user_field_names: 'true',
      }
    );
  }
  async listRows(
    table_id: number,
    page?: number,
    limit?: number,
    search?: string,
    order_by?: string,
    filters?: Record<string, string>,
    advancedFilters?: { filter_type: string; filters: { field: number; type: string; value: string }[] }
  ) {
    const query = prepareQuery({
      user_field_names: 'true',
      page: page,
      size: limit,
      search: search,
      order_by: order_by,
      ...filters,
    });
    if (advancedFilters && advancedFilters.filters.length > 0) {
      query['filters'] = JSON.stringify(advancedFilters);
    }
    return await this.makeRequest(
      HttpMethod.GET,
      `/database/rows/table/${table_id}/`,
      query
    );
  }
  async batchCreateRows(table_id: number, items: Record<string, unknown>[]) {
    return await this.makeRequest(
      HttpMethod.POST,
      `/database/rows/table/${table_id}/batch/`,
      { user_field_names: 'true' },
      { items }
    );
  }
  async batchUpdateRows(table_id: number, items: Record<string, unknown>[]) {
    return await this.makeRequest(
      HttpMethod.PATCH,
      `/database/rows/table/${table_id}/batch/`,
      { user_field_names: 'true' },
      { items }
    );
  }
  async batchDeleteRows(table_id: number, ids: number[]) {
    return await this.makeRequest(
      HttpMethod.POST,
      `/database/rows/table/${table_id}/batch-delete/`,
      undefined,
      { items: ids }
    );
  }
  async listViews(table_id: number): Promise<{ id: number; name: string; type: string }[]> {
    return await this.makeRequest(
      HttpMethod.GET,
      `/database/views/table/${table_id}/`,
      { type: 'grid' }
    );
  }
  async aggregateField(
    view_id: number,
    field_id: number,
    aggregation_type: string
  ) {
    return await this.makeRequest(
      HttpMethod.GET,
      `/database/views/grid/${view_id}/aggregation/${field_id}/`,
      { type: aggregation_type }
    );
  }
  async createWebhook(
    tableId: number,
    url: string,
    events: string[],
    name: string
  ): Promise<{ id: number }> {
    return await this.makeRequest<{ id: number }>(
      HttpMethod.POST,
      `/database/webhooks/table/${tableId}/`,
      undefined,
      {
        url,
        events,
        name,
        request_method: 'POST',
        use_user_field_names: true,
      }
    );
  }
  async deleteWebhook(webhookId: number): Promise<void> {
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${this.baseUrl}/api/database/webhooks/${webhookId}/`,
      headers: { Authorization: this.authHeader },
    });
  }
}
