import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ListPage, Paging, QueryFilter, buildListQuery } from './models/common';
import { User, UserCreateRequest, UserUpdateRequest } from './models/user';
import {
  Customer,
  CustomerCreateRequest,
  CustomerListFilter,
  CustomerUpdateRequest,
} from './models/customer';
import {
  Project,
  ProjectCreateRequest,
  ProjectListFilter,
  ProjectBillingRequest,
  ProjectUpdateRequest,
} from './models/project';
import {
  Service,
  ServiceCreateRequest,
  ServiceUpdateRequest,
} from './models/service';
import {
  Entry,
  EntryListFilter,
  EntryListRequest,
  EntryUpdateRequest,
  TimeRecordEntryCreateRequest,
} from './models/entry';
import {
  Absence,
  AbsenceCreateRequest,
  AbsenceListRequest,
  AbsenceUpdateRequest,
} from './models/absence';
import { Team, TeamCreateRequest, TeamUpdateRequest } from './models/team';
import { ClockResponse, ClockStartRequest } from './models/clock';
import { LumpSumService } from './models/lump-sum-service';
import { Subproject, SubprojectListFilter } from './models/subproject';

const BASE_URL = 'https://my.clockodo.com/api';
const MAX_PAGES = 100;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000;
const TRANSIENT_STATUSES = [0, 429, 500, 502, 503, 504];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractVendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string') {
    return body.trim().length > 0 ? body.trim().slice(0, 500) : undefined;
  }
  if (!isRecord(body)) {
    return undefined;
  }
  const parts: string[] = [];
  const errors = body['errors'];
  if (Array.isArray(errors)) {
    for (const entry of errors) {
      if (isRecord(entry) && typeof entry['message'] === 'string') {
        const path = typeof entry['path'] === 'string' && entry['path'].length > 0 ? ` (${entry['path']})` : '';
        parts.push(stripPeriod(entry['message']) + path);
      }
    }
  }
  const source = isRecord(body['error']) ? body['error'] : body;
  if (typeof source['message'] === 'string') {
    parts.push(stripPeriod(source['message']));
  } else if (typeof body['error'] === 'string') {
    parts.push(stripPeriod(body['error']));
  }
  const fields = source['fields'];
  if (isRecord(fields)) {
    for (const [field, detail] of Object.entries(fields)) {
      if (typeof detail === 'string') {
        parts.push(field + ': ' + stripPeriod(detail));
      }
    }
  }
  return parts.length > 0 ? parts.join('; ') : undefined;
}

function stripPeriod(message: string): string {
  return message.trim().replace(/\.+$/, '');
}

function isTryAgainLater(error: unknown): boolean {
  if (!(error instanceof HttpError) || error.response.status !== 409) {
    return false;
  }
  const message = extractVendorMessage(error.response.body) ?? '';
  return /try again later/i.test(message);
}

function describeStatus(status: number): string {
  if (status === 401) {
    return 'authentication failed; check the API user e-mail and API key of the connection';
  }
  if (status === 403) {
    return 'access denied; the Clockodo user lacks the permission or the feature is not part of the plan';
  }
  if (status === 404) {
    return 'the requested record was not found';
  }
  if (status === 429) {
    return 'rate limit reached; wait a minute and retry';
  }
  return 'unexpected response from Clockodo';
}

function toClockodoError({
  error,
  operation,
  method,
}: {
  error: unknown;
  operation: string;
  method: HttpMethod;
}): ClockodoError {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const body = error.response.body;
    const vendorMessage = extractVendorMessage(body);
    const hint =
      status === 429
        ? ' Wait a minute and retry.'
        : status === 403
          ? ' The Clockodo user on this connection does not have permission for this action (check the user\'s role or access group in Clockodo).'
          : '';
    return new ClockodoError({
      message: `Clockodo ${operation} failed (${status}): ${vendorMessage ?? describeStatus(status)}.${hint}`,
      httpStatus: status,
      responseBody: body,
    });
  }
  const reason = error instanceof Error ? error.message : String(error);
  const mayHaveApplied =
    method === HttpMethod.GET
      ? ''
      : ' The change may still have been applied in Clockodo; check before retrying.';
  return new ClockodoError({
    message: `Clockodo ${operation} did not complete (network error: ${reason}).${mayHaveApplied}`,
    httpStatus: 0,
    responseBody: null,
  });
}

function statusOf(error: unknown): number | undefined {
  if (error instanceof HttpError) {
    return error.response.status;
  }
  if (error instanceof Error) {
    return 0;
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unwrapItem<T, L extends string>({
  body,
  legacyKey,
  operation,
}: {
  body: Envelope<T, L> | null | undefined | string;
  legacyKey: L;
  operation: string;
}): T {
  if (isEnvelope<T, L>(body)) {
    const value = body.data ?? body[legacyKey];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  throw new ClockodoError({
    message: `Clockodo ${operation} returned an unexpected response without a record.`,
    httpStatus: 200,
    responseBody: body,
  });
}

function isEnvelope<T, L extends string>(
  body: Envelope<T, L> | null | undefined | string
): body is Envelope<T, L> {
  return isRecord(body);
}

function withHalfDay(absence: Absence): Absence {
  return { ...absence, half_day: absence.count_days === 0.5 };
}

async function withPartialSave<T>({
  saved,
  failedStep,
  step,
}: {
  saved: string[];
  failedStep: string;
  step: () => Promise<T>;
}): Promise<T> {
  try {
    return await step();
  } catch (error) {
    if (saved.length === 0) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new ClockodoError({
      message: `Project ${saved.join(' and ')} were updated, but ${failedStep} failed: ${reason}`,
      httpStatus: error instanceof ClockodoError ? error.httpStatus : 0,
      responseBody: error instanceof ClockodoError ? error.responseBody : null,
    });
  }
}

export class ClockodoClient {
  private readonly email: string;
  private readonly token: string;
  private readonly clientIdentification: string;

  constructor({ email, token, clientName, clientEmail }: ClockodoClientParams) {
    this.email = email.trim();
    this.token = token.trim();
    this.clientIdentification = clientName.trim() + ';' + clientEmail.trim();
  }

  async request<T>({
    method,
    path,
    query,
    body,
    operation,
  }: ClockodoRequestParams): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await httpClient.sendRequest<T>({
          method,
          url: BASE_URL + path,
          queryParams: query,
          body,
          headers: {
            'X-ClockodoApiUser': this.email,
            'X-ClockodoApiKey': this.token,
            'X-Clockodo-External-Application': this.clientIdentification,
            'Accept-Language': 'en',
            Accept: 'application/json',
          },
        });
        return res.body;
      } catch (error) {
        const status = statusOf(error);
        const transientRead =
          method === HttpMethod.GET && status !== undefined && TRANSIENT_STATUSES.includes(status);
        const retryable = attempt < MAX_RETRIES && (transientRead || isTryAgainLater(error));
        if (!retryable) {
          throw toClockodoError({ error, operation, method });
        }
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
      }
    }
  }

  private async item<T, L extends string>({
    method,
    path,
    legacyKey,
    operation,
    body,
  }: ItemParams<L>): Promise<T> {
    const res = await this.request<Envelope<T, L> | string>({
      method,
      path,
      body,
      operation,
    });
    return unwrapItem<T, L>({ body: res, legacyKey, operation });
  }

  private async page<T, L extends string>({
    path,
    legacyKey,
    operation,
    query,
  }: PageParams<L>): Promise<ListPage<T>> {
    const res = await this.request<Envelope<T[], L> | string>({
      method: HttpMethod.GET,
      path,
      query,
      operation,
    });
    if (isEnvelope<T[], L>(res)) {
      const items = res.data ?? res[legacyKey];
      if (Array.isArray(items)) {
        return { items, paging: res.paging };
      }
    }
    throw new ClockodoError({
      message: `Clockodo ${operation} returned an unexpected response without a list.`,
      httpStatus: 200,
      responseBody: res,
    });
  }

  private async all<T, L extends string>({
    path,
    legacyKey,
    operation,
    query,
  }: PageParams<L>): Promise<T[]> {
    const items: T[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await this.page<T, L>({
        path,
        legacyKey,
        operation,
        query: { ...query, page: String(page) },
      });
      for (const entry of res.items) {
        items.push(entry);
      }
      if (!res.paging || page >= res.paging.count_pages) {
        return items;
      }
    }
    throw new ClockodoError({
      message: `Clockodo ${operation} stopped after ${MAX_PAGES} pages. Narrow the filters (for example a shorter date range) and try again.`,
      httpStatus: 0,
      responseBody: null,
    });
  }

  private async remove({ path, operation }: { path: string; operation: string }): Promise<void> {
    await this.request<unknown>({ method: HttpMethod.DELETE, path, operation });
  }

  getCurrentUser(): Promise<User> {
    return this.item<User, 'user'>({
      method: HttpMethod.GET,
      path: '/v4/users/me',
      legacyKey: 'user',
      operation: 'get current user',
    });
  }

  listUsers(): Promise<User[]> {
    return this.all<User, 'users'>({ path: '/v3/users', legacyKey: 'users', operation: 'list users' });
  }

  getUser(id: number): Promise<User> {
    return this.item<User, 'user'>({
      method: HttpMethod.GET,
      path: '/v3/users/' + id,
      legacyKey: 'user',
      operation: 'get user',
    });
  }

  createUser(request: UserCreateRequest): Promise<User> {
    return this.item<User, 'user'>({
      method: HttpMethod.POST,
      path: '/v3/users',
      legacyKey: 'user',
      operation: 'create user',
      body: request,
    });
  }

  updateUser({ id, request }: { id: number; request: UserUpdateRequest }): Promise<User> {
    return this.item<User, 'user'>({
      method: HttpMethod.PUT,
      path: '/v3/users/' + id,
      legacyKey: 'user',
      operation: 'update user',
      body: request,
    });
  }

  deleteUser(id: number): Promise<void> {
    return this.remove({ path: '/v3/users/' + id, operation: 'delete user' });
  }

  listTeams(): Promise<Team[]> {
    return this.all<Team, 'teams'>({ path: '/v3/teams', legacyKey: 'teams', operation: 'list teams' });
  }

  getTeam(id: number): Promise<Team> {
    return this.item<Team, 'team'>({
      method: HttpMethod.GET,
      path: '/v3/teams/' + id,
      legacyKey: 'team',
      operation: 'get team',
    });
  }

  createTeam(request: TeamCreateRequest): Promise<Team> {
    return this.item<Team, 'team'>({
      method: HttpMethod.POST,
      path: '/v3/teams',
      legacyKey: 'team',
      operation: 'create team',
      body: request,
    });
  }

  updateTeam({ id, request }: { id: number; request: TeamUpdateRequest }): Promise<Team> {
    return this.item<Team, 'team'>({
      method: HttpMethod.PUT,
      path: '/v3/teams/' + id,
      legacyKey: 'team',
      operation: 'update team',
      body: request,
    });
  }

  deleteTeam(id: number): Promise<void> {
    return this.remove({ path: '/v3/teams/' + id, operation: 'delete team' });
  }

  listCustomers({ page, filter }: { page: number; filter?: CustomerListFilter }): Promise<ListPage<Customer>> {
    return this.page<Customer, 'customers'>({
      path: '/v3/customers',
      legacyKey: 'customers',
      operation: 'list customers',
      query: buildListQuery({ params: { page }, filter }),
    });
  }

  listAllCustomers(filter: CustomerListFilter = {}): Promise<Customer[]> {
    return this.all<Customer, 'customers'>({
      path: '/v3/customers',
      legacyKey: 'customers',
      operation: 'list customers',
      query: buildListQuery({ filter }),
    });
  }

  getCustomer(id: number): Promise<Customer> {
    return this.item<Customer, 'customer'>({
      method: HttpMethod.GET,
      path: '/v3/customers/' + id,
      legacyKey: 'customer',
      operation: 'get customer',
    });
  }

  createCustomer(request: CustomerCreateRequest): Promise<Customer> {
    return this.item<Customer, 'customer'>({
      method: HttpMethod.POST,
      path: '/v3/customers',
      legacyKey: 'customer',
      operation: 'create customer',
      body: request,
    });
  }

  updateCustomer({ id, request }: { id: number; request: CustomerUpdateRequest }): Promise<Customer> {
    return this.item<Customer, 'customer'>({
      method: HttpMethod.PUT,
      path: '/v3/customers/' + id,
      legacyKey: 'customer',
      operation: 'update customer',
      body: request,
    });
  }

  deleteCustomer(id: number): Promise<void> {
    return this.remove({ path: '/v3/customers/' + id, operation: 'delete customer' });
  }

  listProjects({ page, filter }: { page: number; filter?: ProjectListFilter }): Promise<ListPage<Project>> {
    return this.page<Project, 'projects'>({
      path: '/v4/projects',
      legacyKey: 'projects',
      operation: 'list projects',
      query: buildListQuery({ params: { page }, filter }),
    });
  }

  listAllProjects(filter: ProjectListFilter = {}): Promise<Project[]> {
    return this.all<Project, 'projects'>({
      path: '/v4/projects',
      legacyKey: 'projects',
      operation: 'list projects',
      query: buildListQuery({ filter }),
    });
  }

  getProject(id: number): Promise<Project> {
    return this.item<Project, 'project'>({
      method: HttpMethod.GET,
      path: '/v4/projects/' + id,
      legacyKey: 'project',
      operation: 'get project',
    });
  }

  createProject(request: ProjectCreateRequest): Promise<Project> {
    return this.item<Project, 'project'>({
      method: HttpMethod.POST,
      path: '/v4/projects',
      legacyKey: 'project',
      operation: 'create project',
      body: request,
    });
  }

  updateProject({ id, request }: { id: number; request: ProjectUpdateRequest }): Promise<Project> {
    return this.item<Project, 'project'>({
      method: HttpMethod.PUT,
      path: '/v4/projects/' + id,
      legacyKey: 'project',
      operation: 'update project',
      body: request,
    });
  }

  async updateProjectAndCompletion({
    id,
    request,
    completed,
    billing,
  }: {
    id: number;
    request: ProjectUpdateRequest;
    completed?: boolean;
    billing?: ProjectBillingRequest;
  }): Promise<Project> {
    const hasChanges = Object.keys(request).length > 0;
    const hasBilling = billing !== undefined && Object.keys(billing).length > 0;
    if (!hasChanges && !hasBilling && completed === undefined) {
      throw new Error('Provide at least one field to update.');
    }
    const saved: string[] = [];
    let latest = hasChanges ? await this.updateProject({ id, request }) : undefined;
    if (hasChanges) {
      saved.push('fields');
    }
    if (hasBilling) {
      await withPartialSave({
        saved,
        failedStep: 'setting the billing state',
        step: () =>
          this.request<unknown>({
            method: HttpMethod.PUT,
            path: '/v3/projects/' + id + '/setBilled',
            body: billing,
            operation: 'set project billing',
          }),
      });
      saved.push('billing');
      latest = undefined;
    }
    if (completed === undefined) {
      return latest ?? this.getProject(id);
    }
    return withPartialSave({
      saved,
      failedStep: `marking it ${completed ? 'completed' : 'not completed'}`,
      step: () =>
        this.item<Project, 'project'>({
          method: HttpMethod.PUT,
          path: '/v4/projects/' + id + '/complete',
          legacyKey: 'project',
          operation: completed ? 'complete project' : 'reopen project',
          body: { completed },
        }),
    });
  }

  deleteProject(id: number): Promise<void> {
    return this.remove({ path: '/v4/projects/' + id, operation: 'delete project' });
  }

  listSubprojects(filter: SubprojectListFilter = {}): Promise<Subproject[]> {
    return this.all<Subproject, 'subprojects'>({
      path: '/v3/subprojects',
      legacyKey: 'subprojects',
      operation: 'list subprojects',
      query: buildListQuery({ filter }),
    });
  }

  listServices(): Promise<Service[]> {
    return this.all<Service, 'services'>({ path: '/v4/services', legacyKey: 'services', operation: 'list services' });
  }

  getService(id: number): Promise<Service> {
    return this.item<Service, 'service'>({
      method: HttpMethod.GET,
      path: '/v4/services/' + id,
      legacyKey: 'service',
      operation: 'get service',
    });
  }

  createService(request: ServiceCreateRequest): Promise<Service> {
    return this.item<Service, 'service'>({
      method: HttpMethod.POST,
      path: '/v4/services',
      legacyKey: 'service',
      operation: 'create service',
      body: request,
    });
  }

  updateService({ id, request }: { id: number; request: ServiceUpdateRequest }): Promise<Service> {
    return this.item<Service, 'service'>({
      method: HttpMethod.PUT,
      path: '/v4/services/' + id,
      legacyKey: 'service',
      operation: 'update service',
      body: request,
    });
  }

  deleteService(id: number): Promise<void> {
    return this.remove({ path: '/v4/services/' + id, operation: 'delete service' });
  }

  listLumpSumServices(filter: QueryFilter = {}): Promise<LumpSumService[]> {
    return this.all<LumpSumService, 'lumpSumServices'>({
      path: '/v4/lumpSumServices',
      legacyKey: 'lumpSumServices',
      operation: 'list lump-sum services',
      query: buildListQuery({ filter }),
    });
  }

  listEntries(request: EntryListRequest): Promise<ListPage<Entry>> {
    return this.page<Entry, 'entries'>({
      path: '/v2/entries',
      legacyKey: 'entries',
      operation: 'list entries',
      query: buildListQuery({
        params: {
          time_since: request.time_since,
          time_until: request.time_until,
          page: request.page,
          enhanced_list: request.enhanced_list,
        },
        filter: request.filter,
      }),
    });
  }

  listAllEntries({
    time_since,
    time_until,
    filter,
    enhanced_list,
  }: {
    time_since: string;
    time_until: string;
    filter?: EntryListFilter;
    enhanced_list?: boolean;
  }): Promise<Entry[]> {
    return this.all<Entry, 'entries'>({
      path: '/v2/entries',
      legacyKey: 'entries',
      operation: 'list entries',
      query: buildListQuery({
        params: { time_since, time_until, enhanced_list },
        filter,
      }),
    });
  }

  getEntry(id: number): Promise<Entry> {
    return this.item<Entry, 'entry'>({
      method: HttpMethod.GET,
      path: '/v2/entries/' + id,
      legacyKey: 'entry',
      operation: 'get entry',
    });
  }

  createEntry(request: TimeRecordEntryCreateRequest): Promise<Entry> {
    return this.item<Entry, 'entry'>({
      method: HttpMethod.POST,
      path: '/v2/entries',
      legacyKey: 'entry',
      operation: 'create entry',
      body: request,
    });
  }

  updateEntry({ id, request }: { id: number; request: EntryUpdateRequest }): Promise<Entry> {
    return this.item<Entry, 'entry'>({
      method: HttpMethod.PUT,
      path: '/v2/entries/' + id,
      legacyKey: 'entry',
      operation: 'update entry',
      body: request,
    });
  }

  deleteEntry(id: number): Promise<void> {
    return this.remove({ path: '/v2/entries/' + id, operation: 'delete entry' });
  }

  getClock(): Promise<ClockResponse> {
    return this.request<ClockResponse>({
      method: HttpMethod.GET,
      path: '/v2/clock',
      operation: 'get running clock',
    });
  }

  startClock(request: ClockStartRequest): Promise<ClockResponse> {
    return this.request<ClockResponse>({
      method: HttpMethod.POST,
      path: '/v2/clock',
      body: request,
      operation: 'start clock',
    });
  }

  stopClock(entryId: number): Promise<ClockResponse> {
    return this.request<ClockResponse>({
      method: HttpMethod.DELETE,
      path: '/v2/clock/' + entryId,
      operation: 'stop clock',
    });
  }

  async listAbsences(request: AbsenceListRequest): Promise<Absence[]> {
    const absences = await this.all<Absence, 'absences'>({
      path: '/v4/absences',
      legacyKey: 'absences',
      operation: 'list absences',
      query: buildListQuery({
        filter: { year: request.year, users_id: request.users_id },
      }),
    });
    return absences.map(withHalfDay);
  }

  async getAbsence(id: number): Promise<Absence> {
    const absence = await this.item<Absence, 'absence'>({
      method: HttpMethod.GET,
      path: '/v4/absences/' + id,
      legacyKey: 'absence',
      operation: 'get absence',
    });
    return withHalfDay(absence);
  }

  async createAbsence(request: AbsenceCreateRequest): Promise<Absence> {
    const absence = await this.item<Absence, 'absence'>({
      method: HttpMethod.POST,
      path: '/v4/absences',
      legacyKey: 'absence',
      operation: 'create absence',
      body: request,
    });
    return withHalfDay(absence);
  }

  async updateAbsence({ id, request }: { id: number; request: AbsenceUpdateRequest }): Promise<Absence> {
    const absence = await this.item<Absence, 'absence'>({
      method: HttpMethod.PUT,
      path: '/v4/absences/' + id,
      legacyKey: 'absence',
      operation: 'update absence',
      body: request,
    });
    return withHalfDay(absence);
  }

  deleteAbsence(id: number): Promise<void> {
    return this.remove({ path: '/v4/absences/' + id, operation: 'delete absence' });
  }
}

export class ClockodoError extends Error {
  readonly httpStatus: number;
  readonly responseBody: unknown;

  constructor({ message, httpStatus, responseBody }: ClockodoErrorParams) {
    super(message);
    this.name = 'ClockodoError';
    this.httpStatus = httpStatus;
    this.responseBody = responseBody;
  }
}

type Envelope<T, L extends string> = { [K in 'data' | L]?: T } & {
  paging?: Paging;
};

type ItemParams<L extends string> = {
  method: HttpMethod;
  path: string;
  legacyKey: L;
  operation: string;
  body?: object;
};

type PageParams<L extends string> = {
  path: string;
  legacyKey: L;
  operation: string;
  query?: Record<string, string>;
};

type ClockodoErrorParams = {
  message: string;
  httpStatus: number;
  responseBody: unknown;
};

export type ClockodoClientParams = {
  email: string;
  token: string;
  clientName: string;
  clientEmail: string;
};

export type ClockodoRequestParams = {
  method: HttpMethod;
  path: string;
  operation: string;
  query?: Record<string, string>;
  body?: object;
};
