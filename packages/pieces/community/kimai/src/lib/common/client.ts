import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
  HttpResponse,
} from '@activepieces/pieces-common';

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
    private user: string,
    private apiPassword: string
  ) {
    // Remove trailing slash from base URL
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async ping(): Promise<PingResponse> {
    return (await this.makeRequest<PingResponse>(HttpMethod.GET, '/api/ping'))
      .body;
  }

  async getProjects(): Promise<ProjectResponse[]> {
    return (
      await this.makeRequest<ProjectResponse[]>(HttpMethod.GET, '/api/projects')
    ).body;
  }

  async getActivities(
    project: number | undefined = undefined
  ): Promise<ActivityResponse[]> {
    return (
      await this.makeRequest<ActivityResponse[]>(
        HttpMethod.GET,
        '/api/activities',
        {
          project: project,
        }
      )
    ).body;
  }

  async createTimesheet(
    createData: TimesheetCreateRequest
  ): Promise<TimesheetResponse> {
    return (
      await this.makeRequest<TimesheetResponse>(
        HttpMethod.POST,
        '/api/timesheets',
        createData
      )
    ).body;
  }

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    body: any | undefined = undefined
  ): Promise<HttpResponse<T>> {
    return await httpClient.sendRequest<T>({
      method: method,
      url: `${this.baseUrl}${resourceUri}`,
      headers: {
        'X-AUTH-USER': this.user,
        'X-AUTH-TOKEN': this.apiPassword,
      },
      body: body,
    });
  }
}
