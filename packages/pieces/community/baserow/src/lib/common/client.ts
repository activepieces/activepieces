import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { BaserowField } from './types';

function emptyValueFilter(
  accessor: (key: string) => any
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

export function prepareQuery(request?: Record<string, any>): QueryParams {
  const params: QueryParams = {};
  if (!request) return params;
  Object.keys(request)
    .filter(emptyValueFilter((k) => request[k]))
    .forEach((k: string) => {
      params[k] = (request as Record<string, any>)[k].toString();
    });
  return params;
}

export class BaserowClient {
  constructor(private baseUrl: string, private token: string) {}
  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    url: string,
    query?: QueryParams,
    body?: object
  ): Promise<T> {
    const res = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}/api${url}`,
      headers: { Authorization: `Token ${this.token}` },
      queryParams: query,
      body,
    });
    return res.body;
  }
  async listTableFields(table_id: number): Promise<BaserowField[]> {
    return await this.makeRequest<BaserowField[]>(
      HttpMethod.GET,
      `/database/fields/table/${table_id}/`
    );
  }
  async createRow(table_id: number, request: Record<string, any>) {
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
    request: Record<string, any>
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
    limit?: number,
    search?: string,
    order_by?: string
  ) {
    return await this.makeRequest(
      HttpMethod.GET,
      `/database/rows/table/${table_id}/`,
      prepareQuery({
        user_field_names: 'true',
        size: limit,
        search: search,
        order_by: order_by,
      })
    );
  }
}
