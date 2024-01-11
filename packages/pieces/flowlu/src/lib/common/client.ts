import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import {
  Account,
  AccountCategory,
  AccountHonorificTitle,
  AccountIndustry,
  CreateCRMAccountAPIRequest,
  CreateOpportunityAPIRequest,
  CreateTaskAPIRequest,
  ListAPIResponse,
  Opportunity,
  OpportunitySource,
  Task,
  TaskWorkflow,
  TaskWorkflowStage,
  User,
} from './types';

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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      queryParams: { api_key: this.apiKey, ...query },
      body: body,
    });
    return res.body;
  }
  async listAllTasks() {
    return await this.makeRequest<ListAPIResponse<Task[]>>(
      HttpMethod.GET,
      '/task/tasks/list'
    );
  }
  async getTask(id: number) {
    return await this.makeRequest(HttpMethod.GET, `/task/tasks/get/${id}`);
  }
  async listAllUsers() {
    return await this.makeRequest<ListAPIResponse<User[]>>(
      HttpMethod.GET,
      '/core/user/list'
    );
  }
  async listAllTaskWorkflow() {
    return await this.makeRequest<ListAPIResponse<TaskWorkflow[]>>(
      HttpMethod.GET,
      '/task/workflows/list'
    );
  }
  async listAllTaskStages() {
    return await this.makeRequest<ListAPIResponse<TaskWorkflowStage[]>>(
      HttpMethod.GET,
      '/task/stages/list'
    );
  }
  async listAllHonorificTitles() {
    return await this.makeRequest<ListAPIResponse<AccountHonorificTitle[]>>(
      HttpMethod.GET,
      '/crm/honorific_title/list'
    );
  }
  async listAllAccountCategories() {
    return await this.makeRequest<ListAPIResponse<AccountCategory[]>>(
      HttpMethod.GET,
      '/crm/account_category/list'
    );
  }
  async listAllAccounts() {
    return await this.makeRequest<ListAPIResponse<Account[]>>(
      HttpMethod.GET,
      '/crm/account/list'
    );
  }
  async listAllContacts() {
    return await this.makeRequest<ListAPIResponse<Account[]>>(
      HttpMethod.GET,
      '/crm/account/list',
      { 'filter[type]': '2' }
    );
  }
  async listAllAccountIndustries() {
    return await this.makeRequest<ListAPIResponse<AccountIndustry[]>>(
      HttpMethod.GET,
      '/crm/industry/list'
    );
  }
  async listAllOpportunitySources() {
    return await this.makeRequest<ListAPIResponse<OpportunitySource[]>>(
      HttpMethod.GET,
      '/crm/source/list'
    );
  }
  async listAllOpportunities() {
    return await this.makeRequest<ListAPIResponse<Opportunity[]>>(
      HttpMethod.GET,
      '/crm/lead/list'
    );
  }
  async createTask(request: CreateTaskAPIRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/task/tasks/create',
      undefined,
      request
    );
  }
  async createAccount(request: CreateCRMAccountAPIRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/crm/account/create',
      undefined,
      request
    );
  }
  async createOpportunity(request: CreateOpportunityAPIRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      '/crm/lead/create',
      undefined,
      request
    );
  }
  async updateOpportunity(id: number, request: CreateOpportunityAPIRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      `/crm/lead/update/${id}`,
      undefined,
      request
    );
  }
  async updateTask(id: number, request: CreateTaskAPIRequest) {
    return await this.makeRequest(
      HttpMethod.POST,
      `/task/tasks/update/${id}`,
      undefined,
      request
    );
  }
  async deleteAction(moduleName: string, entityName: string, id: number) {
    return await this.makeRequest(
      HttpMethod.GET,
      `/${moduleName}/${entityName}/delete/${id}`
    );
  }
}
