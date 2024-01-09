import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { TaskListResponse } from './types';

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

export class FlowluClient {
  constructor(private domain: string, private apiKey: string) {}
  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    query?: QueryParams,
    body: any | undefined = undefined
  ): Promise<T> {
    const res = await httpClient.sendRequest<T>({
      method: method,
      url: `https://${this.domain}.flowlu.com/api/v1/module` + resourceUri,
      queryParams: { api_key: this.apiKey, ...query },
      body: body,
    });
    return res.body;
  }
  async listAllTasks() {
    return await this.makeRequest<{ response: TaskListResponse }>(
      HttpMethod.GET,
      '/task/tasks/list'
    );
  }
  async getTask(id: number) {
    return await this.makeRequest(HttpMethod.GET, `/task/tasks/get/${id}`);
  }
  async deleteTask(id: number) {
    return await this.makeRequest(HttpMethod.GET, `/task/tasks/delete/${id}`);
  }
}
