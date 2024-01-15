import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import {
  ContactCreateRequest,
  ClientCreateRequest,
  ClientListResponse,
  TaskCreateRequest,
  ProjectCreateRequest,
  ProjectSearchResponse,
  ProjectTaskStageListResponse,
} from './models';

export class MoxieCRMClient {
  constructor(private baseUrl: string, private apiKey: string) {
    // Remove trailing slash from base URL
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    body: any | undefined = undefined,
    query?: QueryParams
  ): Promise<HttpResponse<T>> {
    return await httpClient.sendRequest<T>({
      method: method,
      url: `${this.baseUrl}${resourceUri}`,
      headers: {
        'X-API-KEY': this.apiKey,
      },
      body: body,
      queryParams: query,
    });
  }
  async createContact(request: ContactCreateRequest) {
    return (
      await this.makeRequest(
        HttpMethod.POST,
        '/action/contacts/create',
        request
      )
    ).body;
  }
  async createClient(request: ClientCreateRequest) {
    return (
      await this.makeRequest(HttpMethod.POST, '/action/clients/create', request)
    ).body;
  }
  async listClients(): Promise<ClientListResponse[]> {
    return (
      await this.makeRequest<ClientListResponse[]>(
        HttpMethod.GET,
        '/action/clients/list'
      )
    ).body;
  }
  async listInvoiceTemplates(): Promise<string[]> {
    return (
      await this.makeRequest<string[]>(
        HttpMethod.GET,
        '/action/invoiceTemplates/list'
      )
    ).body;
  }

  async createProject(request: ProjectCreateRequest) {
    return (
      await this.makeRequest(
        HttpMethod.POST,
        '/action/projects/create',
        request
      )
    ).body;
  }
  async createTask(request: TaskCreateRequest) {
    return (
      await this.makeRequest(HttpMethod.POST, '/action/tasks/create', request)
    ).body;
  }

  async searchProjects(clientName: string): Promise<ProjectSearchResponse[]> {
    return (
      await this.makeRequest<ProjectSearchResponse[]>(
        HttpMethod.GET,
        '/action/projects/search',
        undefined,
        { query: clientName }
      )
    ).body;
  }

  async listProjectTaskStages(): Promise<ProjectTaskStageListResponse[]> {
    return (
      await this.makeRequest<ProjectTaskStageListResponse[]>(
        HttpMethod.GET,
        '/action/taskStages/list'
      )
    ).body;
  }
}
