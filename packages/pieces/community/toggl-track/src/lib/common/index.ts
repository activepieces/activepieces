import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const togglTrackApi = {
  BASE_URL: 'https://api.track.toggl.com/api/v9',

  async getWorkspaces(apiToken: string): Promise<any[]> {
    const response = await httpClient.sendRequest<any[]>({
      method: HttpMethod.GET,
      url: `${this.BASE_URL}/workspaces`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
    });
    return response.body;
  },

  async getProjects(apiToken: string, workspaceId: number): Promise<any[]> {
    const response = await httpClient.sendRequest<any[]>({
      method: HttpMethod.GET,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/projects`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
    });
    return response.body;
  },

  async getTasks(apiToken: string, workspaceId: number, projectId: number): Promise<any[]> {
    const response = await httpClient.sendRequest<any[]>({
      method: HttpMethod.GET,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
    });
    return response.body;
  },

  async getClients(apiToken: string, workspaceId: number): Promise<any[]> {
    const response = await httpClient.sendRequest<any[]>({
      method: HttpMethod.GET,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/clients`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
    });
    return response.body;
  },

  async getTags(apiToken: string, workspaceId: number): Promise<any[]> {
    const response = await httpClient.sendRequest<any[]>({
      method: HttpMethod.GET,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/tags`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
    });
    return response.body;
  },

  async getTimeEntries(apiToken: string): Promise<any[]> {
    const response = await httpClient.sendRequest<any[]>({
      method: HttpMethod.GET,
      url: `${this.BASE_URL}/me/time_entries`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
    });
    return response.body;
  },

  async getWorkspaceUsers(apiToken: string, workspaceId: number): Promise<any[]> {
    const response = await httpClient.sendRequest<any[]>({
      method: HttpMethod.GET,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/users`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
    });
    return response.body;
  },

  async createClient(
    apiToken: string,
    workspaceId: number,
    clientName: string
  ): Promise<any> {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/clients`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: {
        name: clientName,
        wid: workspaceId,
      },
    });
    return response.body;
  },

  async createProject(
    apiToken: string,
    workspaceId: number,
    projectName: string
  ): Promise<any> {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/projects`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: {
        name: projectName,
      },
    });
    return response.body;
  },

  async createTask(
    apiToken: string,
    workspaceId: number,
    projectId: number,
    taskName: string
  ): Promise<any> {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: {
        name: taskName,
      },
    });
    return response.body;
  },

  async createTag(
    apiToken: string,
    workspaceId: number,
    tagName: string
  ): Promise<any> {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/tags`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: {
        name: tagName,
      },
    });
    return response.body;
  },

  async createTimeEntry(
    apiToken: string,
    workspaceId: number,
    timeEntry: any
  ): Promise<any> {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/time_entries`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: timeEntry,
    });
    return response.body;
  },

  async startTimeEntry(
    apiToken: string,
    workspaceId: number,
    timeEntry: any
  ): Promise<any> {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/time_entries`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body: timeEntry,
    });
    return response.body;
  },

  async getRunningTimeEntry(apiToken: string): Promise<any> {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.GET,
      url: `${this.BASE_URL}/me/time_entries/current`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
    });
    return response.body;
  },

  async stopTimeEntry(
    apiToken: string,
    workspaceId: number,
    timeEntryId: number
  ): Promise<any> {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.PATCH,
      url: `${this.BASE_URL}/workspaces/${workspaceId}/time_entries/${timeEntryId}/stop`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
    });
    return response.body;
  },
};
