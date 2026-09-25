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
      params[k] = request[k]!.toString();
    });
  return params;
}

export class BaserowClient {
  constructor(
    private baseUrl: string,
    private authHeader: string,
    private isJwt: boolean = false
  ) { }

  static async getJwtToken({
    apiUrl,
    email,
    password,
  }: {
    apiUrl: string;
    email: string;
    password: string;
  }): Promise<string> {
    const res = await httpClient.sendRequest<{ token: string }>({
      method: HttpMethod.POST,
      url: `${apiUrl}/api/user/token-auth/`,
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
    if (this.isJwt) {
      const apps = await this.makeRequest<Array<{ id: number; type: string; tables: BaserowTable[] }>>(
        HttpMethod.GET,
        `/applications/`
      );
      return apps.filter((a) => a.type === 'database').flatMap((a) => a.tables);
    }
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
  ): Promise<{ results: Array<{ id: number } & Record<string, unknown>>; count: number }> {
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
    return await this.makeRequest<{ results: Array<{ id: number } & Record<string, unknown>>; count: number }>(
      HttpMethod.GET,
      `/database/rows/table/${table_id}/`,
      query
    );
  }
  async batchCreateRows(table_id: number, items: unknown[]): Promise<{ items: Record<string, unknown>[] }> {
    return await this.makeRequest<{ items: Record<string, unknown>[] }>(
      HttpMethod.POST,
      `/database/rows/table/${table_id}/batch/`,
      { user_field_names: 'true' },
      { items }
    );
  }
  async batchUpdateRows(table_id: number, items: unknown[]): Promise<{ items: Record<string, unknown>[] }> {
    return await this.makeRequest<{ items: Record<string, unknown>[] }>(
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
  ): Promise<{ value: unknown }> {
    return await this.makeRequest<{ value: unknown }>(
      HttpMethod.GET,
      `/database/views/grid/${view_id}/aggregation/${field_id}/`,
      { type: aggregation_type }
    );
  }
  async updateFieldSelectOptions({
    fieldId,
    existingOptions,
    newOptions,
  }: {
    fieldId: number;
    existingOptions: { id: number; value: string; color: string }[];
    newOptions: string[];
  }): Promise<{ select_options: { id: number; value: string; color: string }[] }> {
    const palette = ['blue', 'green', 'orange', 'red', 'purple', 'pink', 'cyan', 'yellow', 'gray'];
    const additions = newOptions.map((value, i) => ({
      value,
      color: palette[i % palette.length],
    }));
    return await this.makeRequest(
      HttpMethod.PATCH,
      `/database/fields/${fieldId}/`,
      undefined,
      { select_options: [...existingOptions, ...additions] }
    );
  }
  async createWebhook({
    tableId,
    url,
    events,
    name,
  }: {
    tableId: number;
    url: string;
    events: string[];
    name: string;
  }): Promise<{ id: number }> {
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
  async uploadFileFromUrl({ url }: { url: string }): Promise<Record<string, unknown>> {
    return await this.makeRequest(
      HttpMethod.POST,
      `/user-files/upload-via-url/`,
      undefined,
      { url }
    );
  }
  async queryRows({
    tableId,
    query,
  }: {
    tableId: number;
    query: QueryParams;
  }): Promise<BaserowRowPage> {
    return await this.makeRequest<BaserowRowPage>(
      HttpMethod.GET,
      `/database/rows/table/${tableId}/`,
      { ...query, user_field_names: 'true' }
    );
  }
  async listAllViews({ tableId }: { tableId: number }): Promise<Record<string, unknown>[]> {
    return await this.makeRequest<Record<string, unknown>[]>(
      HttpMethod.GET,
      `/database/views/table/${tableId}/`
    );
  }
  async listApplications(): Promise<BaserowApplication[]> {
    return await this.makeRequest<BaserowApplication[]>(HttpMethod.GET, `/applications/`);
  }
  async listWorkspaces(): Promise<Record<string, unknown>[]> {
    return await this.makeRequest<Record<string, unknown>[]>(HttpMethod.GET, `/workspaces/`);
  }
  async createDatabase({
    workspaceId,
    name,
  }: {
    workspaceId: number;
    name: string;
  }): Promise<Record<string, unknown>> {
    return await this.makeRequest(
      HttpMethod.POST,
      `/applications/workspace/${workspaceId}/`,
      undefined,
      { type: 'database', name, init_with_data: false }
    );
  }
  async getTable({ tableId }: { tableId: number }): Promise<Record<string, unknown>> {
    return await this.makeRequest(HttpMethod.GET, `/database/tables/${tableId}/`);
  }
  async createTable({
    databaseId,
    name,
    data,
    firstRowHeader,
  }: {
    databaseId: number;
    name: string;
    data: unknown[][];
    firstRowHeader: boolean;
  }): Promise<Record<string, unknown>> {
    return await this.makeRequest(
      HttpMethod.POST,
      `/database/tables/database/${databaseId}/`,
      undefined,
      { name, data, first_row_header: firstRowHeader }
    );
  }
  async updateTable({
    tableId,
    name,
  }: {
    tableId: number;
    name: string;
  }): Promise<Record<string, unknown>> {
    return await this.makeRequest(
      HttpMethod.PATCH,
      `/database/tables/${tableId}/`,
      undefined,
      { name }
    );
  }
  async deleteTable({ tableId }: { tableId: number }): Promise<void> {
    await this.makeRequest(HttpMethod.DELETE, `/database/tables/${tableId}/`);
  }
  async createField({
    tableId,
    body,
  }: {
    tableId: number;
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    return await this.makeRequest(
      HttpMethod.POST,
      `/database/fields/table/${tableId}/`,
      undefined,
      body
    );
  }
  async updateField({
    fieldId,
    body,
  }: {
    fieldId: number;
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    return await this.makeRequest(
      HttpMethod.PATCH,
      `/database/fields/${fieldId}/`,
      undefined,
      body
    );
  }
  async deleteField({ fieldId }: { fieldId: number }): Promise<Record<string, unknown>> {
    return await this.makeRequest(HttpMethod.DELETE, `/database/fields/${fieldId}/`);
  }
  async getFieldUniqueValues({
    fieldId,
    limit,
    splitCommaSeparated,
  }: {
    fieldId: number;
    limit?: number;
    splitCommaSeparated?: boolean;
  }): Promise<{ values: string[] }> {
    return await this.makeRequest<{ values: string[] }>(
      HttpMethod.GET,
      `/database/fields/${fieldId}/unique_row_values/`,
      prepareQuery({ limit, split_comma_separated: splitCommaSeparated })
    );
  }
  async listRowNames({
    tableId,
    rowIds,
  }: {
    tableId: number;
    rowIds: number[];
  }): Promise<Record<string, Record<string, string>>> {
    return await this.makeRequest<Record<string, Record<string, string>>>(
      HttpMethod.GET,
      `/database/rows/names/`,
      { [`table__${tableId}`]: rowIds.join(',') }
    );
  }
  async getRowHistory({
    tableId,
    rowId,
    limit,
    offset,
  }: {
    tableId: number;
    rowId: number;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>> {
    return await this.makeRequest(
      HttpMethod.GET,
      `/database/rows/table/${tableId}/${rowId}/history/`,
      prepareQuery({ limit, offset })
    );
  }
  async listWorkspaceUsers({
    workspaceId,
    search,
  }: {
    workspaceId: number;
    search?: string;
  }): Promise<Record<string, unknown>[]> {
    return await this.makeRequest<Record<string, unknown>[]>(
      HttpMethod.GET,
      `/workspaces/users/workspace/${workspaceId}/`,
      prepareQuery({ search })
    );
  }
  async searchWorkspace({
    workspaceId,
    query,
    limit,
    offset,
  }: {
    workspaceId: number;
    query: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>> {
    return await this.makeRequest(
      HttpMethod.GET,
      `/search/workspace/${workspaceId}/`,
      prepareQuery({ query, limit, offset })
    );
  }
  async exportTable({
    tableId,
    body,
  }: {
    tableId: number;
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    return await this.makeRequest(
      HttpMethod.POST,
      `/database/export/table/${tableId}/`,
      undefined,
      body
    );
  }
  async getExportJob({ jobId }: { jobId: number }): Promise<Record<string, unknown>> {
    return await this.makeRequest(HttpMethod.GET, `/database/export/${jobId}/`);
  }
  async createView({
    tableId,
    name,
    type,
  }: {
    tableId: number;
    name: string;
    type: string;
  }): Promise<Record<string, unknown>> {
    return await this.makeRequest(
      HttpMethod.POST,
      `/database/views/table/${tableId}/`,
      undefined,
      { name, type }
    );
  }
}

type BaserowRowPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{ id: number } & Record<string, unknown>>;
};

type BaserowApplication = {
  id: number;
  name: string;
  type: string;
  workspace?: { id: number; name: string };
  tables?: BaserowTable[];
};
