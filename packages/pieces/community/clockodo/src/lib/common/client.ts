import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { ListRequest, prepareListRequest } from './models/common';
import {
  UserCreateRequest,
  UserListResponse,
  UserSingleResponse,
  UserUpdateRequest,
} from './models/user';
import {
  CustomerSingleResponse,
  CustomerListResponse,
  CustomerCreateRequest,
  CustomerUpdateRequest,
  CustomerListFilter,
  Customer,
} from './models/customer';
import {
  ProjectSingleResponse,
  ProjectListResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectListFilter,
  Project,
} from './models/project';
import {
  ServiceSingleResponse,
  ServiceListResponse,
  ServiceCreateRequest,
  ServiceUpdateRequest,
} from './models/service';
import {
  EntrySingleResponse,
  EntryListResponse,
  EntryCreateRequest,
  EntryUpdateRequest,
  EntryListRequest,
  Entry,
  EntryListFilter,
} from './models/entry';
import {
  AbsenceSingleResponse,
  AbsenceListResponse,
  AbsenceCreateRequest,
  AbsenceUpdateRequest,
  AbsenceListRequest,
} from './models/absence';
import {
  TeamCreateRequest,
  TeamListResponse,
  TeamSingleResponse,
  TeamUpdateRequest,
} from './models/team';

export class ClockodoClient {
  private clientIdentification: string;
  private language = 'en';

  constructor(
    private email: string,
    private token: string,
    clientName: string,
    clientEmail: string
  ) {
    this.clientIdentification = clientName + ';' + clientEmail;
  }

  setLanguage(language: string) {
    this.language = language;
  }

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    url: string,
    query?: QueryParams,
    body?: object
  ): Promise<T> {
    const res = await httpClient.sendRequest<T>({
      method,
      url: 'https://my.clockodo.com/api' + url,
      queryParams: query,
      body,
      headers: {
        'X-ClockodoApiUser': this.email,
        'X-ClockodoApiKey': this.token,
        'X-Clockodo-External-Application': this.clientIdentification,
        'Accept-Language': this.language,
      },
    });
    return res.body;
  }

  listUsers(): Promise<UserListResponse> {
    return this.makeRequest<UserListResponse>(HttpMethod.GET, '/v2/users');
  }

  getUser(id: number): Promise<UserSingleResponse> {
    return this.makeRequest<UserSingleResponse>(
      HttpMethod.GET,
      '/v2/users/' + id
    );
  }

  createUser(request: UserCreateRequest) {
    return this.makeRequest<UserSingleResponse>(
      HttpMethod.POST,
      '/v2/users',
      undefined,
      request
    );
  }

  updateUser(
    id: number,
    request: UserUpdateRequest
  ): Promise<UserSingleResponse> {
    return this.makeRequest<UserSingleResponse>(
      HttpMethod.PUT,
      '/v2/users/' + id,
      undefined,
      request
    );
  }

  deleteUser(id: number): Promise<object> {
    return this.makeRequest<object>(HttpMethod.DELETE, '/v2/users/' + id);
  }

  listTeams(): Promise<TeamListResponse> {
    return this.makeRequest<TeamListResponse>(HttpMethod.GET, '/v2/teams');
  }

  getTeam(id: number): Promise<TeamSingleResponse> {
    return this.makeRequest<TeamSingleResponse>(
      HttpMethod.GET,
      '/v2/teams/' + id
    );
  }

  createTeam(request: TeamCreateRequest) {
    return this.makeRequest<TeamSingleResponse>(
      HttpMethod.POST,
      '/v2/teams',
      undefined,
      request
    );
  }

  updateTeam(
    id: number,
    request: TeamUpdateRequest
  ): Promise<TeamSingleResponse> {
    return this.makeRequest<TeamSingleResponse>(
      HttpMethod.PUT,
      '/v2/teams/' + id,
      undefined,
      request
    );
  }

  deleteTeam(id: number): Promise<object> {
    return this.makeRequest<object>(HttpMethod.DELETE, '/v2/teams/' + id);
  }

  listCustomers(
    request: ListRequest<CustomerListFilter> = {}
  ): Promise<CustomerListResponse> {
    return this.makeRequest<CustomerListResponse>(
      HttpMethod.GET,
      '/v2/customers',
      prepareListRequest(request)
    );
  }

  async listAllCustomers(filter: CustomerListFilter = {}): Promise<Customer[]> {
    let totalPages = 999999;
    const all: Customer[] = [];
    for (let page = 0; page < totalPages; page++) {
      const res = await this.listCustomers({
        page: page + 1,
        filter,
      });
      totalPages = res.paging.count_pages;
      res.customers.forEach((e) => all.push(e));
    }
    return all;
  }

  getCustomer(id: number): Promise<CustomerSingleResponse> {
    return this.makeRequest<CustomerSingleResponse>(
      HttpMethod.GET,
      '/v2/customers/' + id
    );
  }

  createCustomer(request: CustomerCreateRequest) {
    return this.makeRequest<CustomerSingleResponse>(
      HttpMethod.POST,
      '/v2/customers',
      undefined,
      request
    );
  }

  updateCustomer(
    id: number,
    request: CustomerUpdateRequest
  ): Promise<CustomerSingleResponse> {
    return this.makeRequest<CustomerSingleResponse>(
      HttpMethod.PUT,
      '/v2/customers/' + id,
      undefined,
      request
    );
  }

  deleteCustomer(id: number): Promise<object> {
    return this.makeRequest<object>(HttpMethod.DELETE, '/v2/customers/' + id);
  }

  listProjects(
    request: ListRequest<ProjectListFilter> = {}
  ): Promise<ProjectListResponse> {
    return this.makeRequest<ProjectListResponse>(
      HttpMethod.GET,
      '/v2/projects',
      prepareListRequest(request)
    );
  }

  async listAllProjects(filter: ProjectListFilter = {}): Promise<Project[]> {
    let totalPages = 999999;
    const all: Project[] = [];
    for (let page = 0; page < totalPages; page++) {
      const res = await this.listProjects({
        page: page + 1,
        filter,
      });
      totalPages = res.paging.count_pages;
      res.projects.forEach((e) => all.push(e));
    }
    return all;
  }

  getProject(id: number): Promise<ProjectSingleResponse> {
    return this.makeRequest<ProjectSingleResponse>(
      HttpMethod.GET,
      '/v2/projects/' + id
    );
  }

  createProject(request: ProjectCreateRequest) {
    return this.makeRequest<ProjectSingleResponse>(
      HttpMethod.POST,
      '/v2/projects',
      undefined,
      request
    );
  }

  updateProject(
    id: number,
    request: ProjectUpdateRequest
  ): Promise<ProjectSingleResponse> {
    return this.makeRequest<ProjectSingleResponse>(
      HttpMethod.PUT,
      '/v2/projects/' + id,
      undefined,
      request
    );
  }

  deleteProject(id: number): Promise<object> {
    return this.makeRequest<object>(HttpMethod.DELETE, '/v2/projects/' + id);
  }

  listServices(): Promise<ServiceListResponse> {
    return this.makeRequest<ServiceListResponse>(
      HttpMethod.GET,
      '/v2/services'
    );
  }

  getService(id: number): Promise<ServiceSingleResponse> {
    return this.makeRequest<ServiceSingleResponse>(
      HttpMethod.GET,
      '/v2/services/' + id
    );
  }

  createService(request: ServiceCreateRequest) {
    return this.makeRequest<ServiceSingleResponse>(
      HttpMethod.POST,
      '/v2/services',
      undefined,
      request
    );
  }

  updateService(
    id: number,
    request: ServiceUpdateRequest
  ): Promise<ServiceSingleResponse> {
    return this.makeRequest<ServiceSingleResponse>(
      HttpMethod.PUT,
      '/v2/services/' + id,
      undefined,
      request
    );
  }

  deleteService(id: number): Promise<object> {
    return this.makeRequest<object>(HttpMethod.DELETE, '/v2/services/' + id);
  }

  listEntries(request: EntryListRequest): Promise<EntryListResponse> {
    return this.makeRequest<EntryListResponse>(
      HttpMethod.GET,
      '/v2/entries',
      prepareListRequest(request)
    );
  }

  async listAllEntries(
    time_since: string,
    time_until: string,
    filter: EntryListFilter = {}
  ): Promise<Entry[]> {
    let totalPages = 999999;
    const all: Entry[] = [];
    for (let page = 0; page < totalPages; page++) {
      const res = await this.listEntries({
        page: page + 1,
        time_since,
        time_until,
        filter,
      });
      totalPages = res.paging.count_pages;
      res.entries.forEach((e) => all.push(e));
    }
    return all;
  }

  getEntry(id: number): Promise<EntrySingleResponse> {
    return this.makeRequest<EntrySingleResponse>(
      HttpMethod.GET,
      '/v2/entries/' + id
    );
  }

  createEntry(request: EntryCreateRequest) {
    return this.makeRequest<EntrySingleResponse>(
      HttpMethod.POST,
      '/v2/entries',
      undefined,
      request
    );
  }

  updateEntry(
    id: number,
    request: EntryUpdateRequest
  ): Promise<EntrySingleResponse> {
    return this.makeRequest<EntrySingleResponse>(
      HttpMethod.PUT,
      '/v2/entries/' + id,
      undefined,
      request
    );
  }

  deleteEntry(id: number): Promise<object> {
    return this.makeRequest<object>(HttpMethod.DELETE, '/v2/entries/' + id);
  }

  listAbsences(request: AbsenceListRequest): Promise<AbsenceListResponse> {
    const query: QueryParams = {
      year: request.year.toString(),
    };
    if (request.users_id) query.users_id = request.users_id.toString();
    return this.makeRequest<AbsenceListResponse>(
      HttpMethod.GET,
      '/absences',
      query
    );
  }

  getAbsence(id: number): Promise<AbsenceSingleResponse> {
    return this.makeRequest<AbsenceSingleResponse>(
      HttpMethod.GET,
      '/absences/' + id
    );
  }

  createAbsence(request: AbsenceCreateRequest) {
    return this.makeRequest<AbsenceSingleResponse>(
      HttpMethod.POST,
      '/absences',
      undefined,
      request
    );
  }

  updateAbsence(
    id: number,
    request: AbsenceUpdateRequest
  ): Promise<AbsenceSingleResponse> {
    return this.makeRequest<AbsenceSingleResponse>(
      HttpMethod.PUT,
      '/absences/' + id,
      undefined,
      request
    );
  }

  deleteAbsence(id: number): Promise<object> {
    return this.makeRequest<object>(HttpMethod.DELETE, '/absences/' + id);
  }
}
