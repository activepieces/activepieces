import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { spreadIfDefined } from '@activepieces/pieces-framework';

type PingResponse = {
  message: string;
};

type ProjectResponse = {
  id: number;
  name: string;
};

type ActivityResponse = {
  id: number;
  parentTitle?: string;
  name: string;
};

type TimesheetCreateRequest = {
  project: number;
  activity: number;
  begin: string;
  end?: string;
  description?: string;
};

type TimesheetResponse = {
  id: number;
  project: number;
  activity: number;
  begin: string;
  end?: string;
  description?: string;
};

export class KimaiClient {
  constructor(
    private baseUrl: string,
    private apiToken: string
  ) {
    // Remove trailing slash from base URL
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async ping(): Promise<PingResponse> {
    return (
      await this.makeRequest<PingResponse>({
        method: HttpMethod.GET,
        resourceUri: '/api/ping',
      })
    ).body;
  }

  async getProjects(): Promise<ProjectResponse[]> {
    return (
      await this.makeRequest<ProjectResponse[]>({
        method: HttpMethod.GET,
        resourceUri: '/api/projects',
      })
    ).body;
  }

  async getActivities(
    project: number | undefined = undefined
  ): Promise<ActivityResponse[]> {
    return (
      await this.makeRequest<ActivityResponse[]>({
        method: HttpMethod.GET,
        resourceUri: '/api/activities',
        queryParams: spreadIfDefined('project', project?.toString()),
      })
    ).body;
  }

  async createTimesheet(
    createData: TimesheetCreateRequest
  ): Promise<TimesheetResponse> {
    return (
      await this.makeRequest<TimesheetResponse>({
        method: HttpMethod.POST,
        resourceUri: '/api/timesheets',
        body: createData,
      })
    ).body;
  }

  async makeRequest<T extends HttpMessageBody>({
    method,
    resourceUri,
    body = undefined,
    queryParams = undefined,
  }: {
    method: HttpMethod;
    resourceUri: string;
    body?: HttpMessageBody;
    queryParams?: QueryParams;
  }): Promise<HttpResponse<T>> {
    return await httpClient.sendRequest<T>({
      method: method,
      url: `${this.baseUrl}${resourceUri}`,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: body,
      queryParams: queryParams,
    });
  }
}
