import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  ActivityType,
  Category,
  CreateEntryParams,
  CreateOpportunityParams,
  CreatePartyParams,
  CreateProjectParams,
  CreateRestHookParams,
  CreateTaskParams,
  CustomField,
  Entry,
  Filter,
  Milestone,
  Opportunity,
  Party,
  Project,
  RestHook,
  Stage,
  Tag,
  Task,
  Team,
  UpdateOpportunityParams,
  UpdatePartyParams,
  User,
} from './types';
import { CapsuleCrmAuthType } from './auth';

const BASE_URL = 'https://api.capsulecrm.com/api/v2';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ERROR_TEXT = 500;
const DROPDOWN_MAX_PAGES = 10;
const MAX_PER_PAGE = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function vendorDetail(body: unknown): string {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed === '' ? 'no details returned' : trimmed.slice(0, MAX_ERROR_TEXT);
  }
  if (!isRecord(body)) {
    return 'no details returned';
  }
  const parts: string[] = [];
  for (const key of ['message', 'error']) {
    const value = body[key];
    if (typeof value === 'string' && value.trim() !== '') {
      parts.push(value.trim());
    }
  }
  const errors = body['errors'];
  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (isRecord(item) && typeof item['message'] === 'string') {
        const field = typeof item['field'] === 'string' ? `${item['field']}: ` : '';
        parts.push(`${field}${item['message']}`);
      }
    }
  }
  return parts.length === 0 ? 'no details returned' : parts.join('; ').slice(0, MAX_ERROR_TEXT);
}

function transportReason(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error).slice(0, 200);
  }
  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return 'the request timed out';
  }
  const cause: unknown = error.cause;
  if (isRecord(cause) && typeof cause['code'] === 'string') {
    return `network error ${cause['code']}`;
  }
  return error.message.slice(0, 200);
}

function buildQuery(query: CapsuleQuery | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') {
      result[key] = String(value);
    }
  }
  return result;
}

function hasNextPage(headers: Record<string, string | string[] | undefined> | undefined): boolean {
  const raw = headers?.['link'] ?? headers?.['Link'];
  const link = Array.isArray(raw) ? raw.join(',') : raw;
  return typeof link === 'string' && /rel="?next"?/.test(link);
}

function segment(value: number | string): string {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) {
    throw new Error(`Capsule CRM IDs are numeric; got "${text.slice(0, 50)}".`);
  }
  return text;
}

async function request<T>({
  auth,
  operation,
  method,
  path,
  query,
  body,
}: CapsuleRequest): Promise<CapsuleResponse<T>> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      headers: { Accept: 'application/json' },
      queryParams: buildQuery(query),
      body,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return { status: response.status, body: response.body, hasMore: hasNextPage(response.headers) };
  } catch (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      const hint = status >= 500 && operation.endsWith('party') && method !== HttpMethod.GET
        ? ' Capsule returns this server error for some characters it cannot store, such as emoji in names; remove them and retry.'
        : '';
      throw new CapsuleCrmApiError({
        message: `Capsule CRM ${operation} failed (${status}): ${vendorDetail(error.response.body)}.${hint}`,
        httpStatus: status,
        responseBody: error.response.body,
      });
    }
    const suffix =
      method === HttpMethod.GET
        ? ''
        : ' The request may still have been applied; check Capsule CRM before retrying.';
    throw new Error(`Capsule CRM ${operation} failed: ${transportReason(error)}.${suffix}`);
  }
}

function unwrap<T>({ body, key, operation }: { body: Record<string, T | undefined> | undefined; key: string; operation: string }): T {
  const value = body?.[key];
  if (value === undefined) {
    throw new Error(`Capsule CRM ${operation} returned no "${key}" in the response.`);
  }
  return value;
}

async function listPage<T>({
  auth,
  operation,
  path,
  key,
  query,
  page,
  perPage,
}: ListPageParams): Promise<PageResult<T>> {
  const response = await request<Record<string, T[] | undefined>>({
    auth,
    operation,
    method: HttpMethod.GET,
    path,
    query: { ...query, page, perPage },
  });
  const items = response.body?.[key];
  return { items: Array.isArray(items) ? items : [], hasMore: response.hasMore };
}

async function listAll<T>({
  auth,
  operation,
  path,
  key,
  query,
  maxPages = DROPDOWN_MAX_PAGES,
}: ListAllParams): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const result = await listPage<T>({ auth, operation, path, key, query, page, perPage: MAX_PER_PAGE });
    items.push(...result.items);
    if (!result.hasMore) {
      break;
    }
  }
  return items;
}

function buildPartyBody(params: CreatePartyParams): Record<string, unknown> {
  const party: Record<string, unknown> = { type: params.type };
  if (params.type === 'person') {
    party['firstName'] = params.firstName;
    party['lastName'] = params.lastName;
  } else {
    party['name'] = params.name;
  }
  if (params.title) party['title'] = params.title;
  if (params.jobTitle) party['jobTitle'] = params.jobTitle;
  if (params.about) party['about'] = params.about;
  if (params.organisationId) party['organisation'] = { id: params.organisationId };
  if (params.ownerId) party['owner'] = { id: params.ownerId };
  if (params.teamId) party['team'] = { id: params.teamId };
  if (params.tags && params.tags.length > 0) party['tags'] = params.tags.map((tag) => ({ name: tag }));
  if (params.fields && params.fields.length > 0) party['fields'] = params.fields;
  if (params.emailAddresses && params.emailAddresses.length > 0) party['emailAddresses'] = params.emailAddresses;
  if (params.phoneNumbers && params.phoneNumbers.length > 0) party['phoneNumbers'] = params.phoneNumbers;
  if (params.addresses && params.addresses.length > 0) party['addresses'] = params.addresses;
  if (params.websites && params.websites.length > 0) party['websites'] = params.websites;
  return party;
}

function buildPartyUpdateBody(params: UpdatePartyParams): Record<string, unknown> {
  const party: Record<string, unknown> = {};
  if (params.firstName !== undefined) party['firstName'] = params.firstName;
  if (params.lastName !== undefined) party['lastName'] = params.lastName;
  if (params.name !== undefined) party['name'] = params.name;
  if (params.title !== undefined) party['title'] = params.title;
  if (params.jobTitle !== undefined) party['jobTitle'] = params.jobTitle;
  if (params.about !== undefined) party['about'] = params.about;
  if (params.organisationId !== undefined) party['organisation'] = params.organisationId === null ? null : { id: params.organisationId };
  if (params.ownerId !== undefined) party['owner'] = { id: params.ownerId };
  if (params.teamId !== undefined) party['team'] = { id: params.teamId };
  if (params.tags && params.tags.length > 0) party['tags'] = params.tags.map((tag) => ({ name: tag }));
  if (params.addresses && params.addresses.length > 0) party['addresses'] = params.addresses;
  if (params.websites && params.websites.length > 0) party['websites'] = params.websites;
  if (params.emailAddresses && params.emailAddresses.length > 0) party['emailAddresses'] = params.emailAddresses;
  if (params.phoneNumbers && params.phoneNumbers.length > 0) party['phoneNumbers'] = params.phoneNumbers;
  return party;
}

function partyLabel(party: Party): string {
  if (party.type === 'person') {
    const name = [party.firstName, party.lastName].filter((part) => part).join(' ');
    return name === '' ? `Person ${party.id}` : name;
  }
  return party.name || `Organisation ${party.id}`;
}

function toFilter(value: unknown): Filter {
  const conditions = isRecord(value) ? value['conditions'] : undefined;
  if (!Array.isArray(conditions) || conditions.length === 0) {
    throw new Error('The filter must be an object with a non-empty "conditions" array.');
  }
  return {
    conditions: conditions.map((condition) => {
      if (!isRecord(condition) || typeof condition['field'] !== 'string' || typeof condition['operator'] !== 'string') {
        throw new Error('Each filter condition needs a "field" and an "operator" string.');
      }
      const raw = condition['value'];
      const conditionValue = typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean' ? raw : String(raw ?? '');
      return { field: condition['field'], operator: condition['operator'], value: conditionValue };
    }),
  };
}

function toId(value: unknown): number {
  return Number(segment(typeof value === 'number' ? value : String(value ?? '')));
}

function requiredId({ value, label }: { value: unknown; label: string }): number {
  if (value === undefined || value === null || (typeof value === 'string' && EMPTY_TEXT_VALUES.has(value.trim()))) {
    throw new Error(`${label} is required.`);
  }
  return toId(value);
}

function optionalId(value: unknown): number | undefined {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }
  return toId(value);
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return EMPTY_TEXT_VALUES.has(trimmed) ? undefined : trimmed;
}

function requiredText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function splitList(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }
  return value.split(',').map((item) => item.trim()).filter((item) => !EMPTY_TEXT_VALUES.has(item));
}

function pageArgs({ page, perPage, max = MAX_PER_PAGE }: { page: unknown; perPage: unknown; max?: number }): { page: number; perPage: number } {
  const pageNumber = typeof page === 'number' && Number.isFinite(page) ? Math.floor(page) : 1;
  const size = typeof perPage === 'number' && Number.isFinite(perPage) ? Math.floor(perPage) : Math.min(50, max);
  if (pageNumber < 1) {
    throw new Error('Page must be 1 or greater.');
  }
  if (size < 1 || size > max) {
    throw new Error(`Per Page must be between 1 and ${max}.`);
  }
  return { page: pageNumber, perPage: size };
}

function isoDate({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const parsed = match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : undefined;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    throw new Error(`${label} must be a real date in YYYY-MM-DD format, for example 2026-12-31.`);
  }
  return text;
}

function dayFromDateTime({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  const match = /^(\d{4}-\d{2}-\d{2})(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.exec(text);
  if (!match) {
    throw new Error(`${label} must be a date (YYYY-MM-DD) or ISO date-time.`);
  }
  return isoDate({ value: match[1], label });
}

function exactlyOneLink({ partyId, opportunityId, projectId, required }: { partyId: unknown; opportunityId: unknown; projectId: unknown; required: boolean }): LinkTarget | undefined {
  const links: LinkTarget[] = [];
  const party = optionalId(partyId);
  const opportunity = optionalId(opportunityId);
  const project = optionalId(projectId);
  if (party !== undefined) links.push({ key: 'party', id: party });
  if (opportunity !== undefined) links.push({ key: 'opportunity', id: opportunity });
  if (project !== undefined) links.push({ key: 'kase', id: project });
  if (links.length > 1) {
    throw new Error('Give only one of Party ID, Opportunity ID or Project ID.');
  }
  if (required && links.length === 0) {
    throw new Error('Give one of Party ID, Opportunity ID or Project ID.');
  }
  return links[0];
}

export const capsuleCrmClient = {
  segment,
  toId,
  requiredId,
  optionalId,
  optionalText,
  requiredText,
  splitList,
  pageArgs,
  isoDate,
  dayFromDateTime,
  exactlyOneLink,
  partyLabel,
  toFilter,

  async createContact({ auth, params }: { auth: CapsuleCrmAuthType; params: CreatePartyParams }): Promise<Party> {
    const response = await request<{ party?: Party }>({
      auth,
      operation: 'create party',
      method: HttpMethod.POST,
      path: '/parties',
      body: { party: buildPartyBody(params) },
    });
    return unwrap({ body: response.body, key: 'party', operation: 'create party' });
  },

  async updateContact({ auth, partyId, params }: { auth: CapsuleCrmAuthType; partyId: number | string; params: UpdatePartyParams }): Promise<Party> {
    const response = await request<{ party?: Party }>({
      auth,
      operation: 'update party',
      method: HttpMethod.PUT,
      path: `/parties/${segment(partyId)}`,
      body: { party: buildPartyUpdateBody(params) },
    });
    return unwrap({ body: response.body, key: 'party', operation: 'update party' });
  },

  async getParty({ auth, partyId, embed }: { auth: CapsuleCrmAuthType; partyId: number | string; embed?: string }): Promise<Party> {
    const response = await request<{ party?: Party }>({
      auth,
      operation: 'get party',
      method: HttpMethod.GET,
      path: `/parties/${segment(partyId)}`,
      query: { embed },
    });
    return unwrap({ body: response.body, key: 'party', operation: 'get party' });
  },

  async getContact({ auth, contactId }: { auth: CapsuleCrmAuthType; contactId: unknown }): Promise<Party | null> {
    if (typeof contactId !== 'number' && typeof contactId !== 'string') {
      return null;
    }
    try {
      return await capsuleCrmClient.getParty({ auth, partyId: contactId });
    } catch (error) {
      if (error instanceof CapsuleCrmApiError && error.httpStatus === 404) {
        return null;
      }
      throw error;
    }
  },

  async deleteParty({ auth, partyId }: { auth: CapsuleCrmAuthType; partyId: number | string }): Promise<number> {
    const response = await request<unknown>({
      auth,
      operation: 'delete party',
      method: HttpMethod.DELETE,
      path: `/parties/${segment(partyId)}`,
    });
    return response.status;
  },

  async searchPartiesPage({ auth, searchTerm, page, perPage }: SearchPageParams): Promise<PageResult<Party>> {
    const term = searchTerm?.trim() ?? '';
    return listPage<Party>({
      auth,
      operation: 'search parties',
      path: term === '' ? '/parties' : '/parties/search',
      key: 'parties',
      query: { q: term === '' ? undefined : term, embed: 'tags' },
      page,
      perPage,
    });
  },

  async searchContacts({ auth, searchTerm }: { auth: CapsuleCrmAuthType; searchTerm?: string }): Promise<Party[]> {
    const term = searchTerm?.trim() ?? '';
    return listAll<Party>({
      auth,
      operation: 'list parties',
      path: term === '' ? '/parties' : '/parties/search',
      key: 'parties',
      query: { q: term === '' ? undefined : term },
    });
  },

  async findContact({ auth, term }: { auth: CapsuleCrmAuthType; term: string }): Promise<Party[]> {
    const result = await listPage<Party>({
      auth,
      operation: 'search parties',
      path: '/parties/search',
      key: 'parties',
      query: { q: term },
      page: 1,
      perPage: MAX_PER_PAGE,
    });
    return result.items;
  },

  async listTeams({ auth }: AuthOnly): Promise<Team[]> {
    return listAll<Team>({ auth, operation: 'list teams', path: '/teams', key: 'teams' });
  },

  async listTags({ auth, entity }: EntityScoped): Promise<Tag[]> {
    return listAll<Tag>({ auth, operation: 'list tags', path: `/${ENTITY_PATHS[entity]}/tags`, key: 'tags' });
  },

  async listCustomFields({ auth, entity }: EntityScoped): Promise<CustomField[]> {
    return listAll<CustomField>({
      auth,
      operation: 'list custom fields',
      path: `/${ENTITY_PATHS[entity]}/fields/definitions`,
      key: 'definitions',
    });
  },

  async listUsers({ auth }: AuthOnly): Promise<User[]> {
    return listAll<User>({ auth, operation: 'list users', path: '/users', key: 'users' });
  },

  async listMilestones({ auth }: AuthOnly): Promise<Milestone[]> {
    return listAll<Milestone>({ auth, operation: 'list milestones', path: '/milestones', key: 'milestones' });
  },

  async listStages({ auth }: AuthOnly): Promise<Stage[]> {
    return listAll<Stage>({ auth, operation: 'list stages', path: '/stages', key: 'stages' });
  },

  async listCategories({ auth }: AuthOnly): Promise<Category[]> {
    return listAll<Category>({ auth, operation: 'list categories', path: '/categories', key: 'categories' });
  },

  async listActivityTypes({ auth }: AuthOnly): Promise<ActivityType[]> {
    return listAll<ActivityType>({ auth, operation: 'list activity types', path: '/activitytypes', key: 'activityTypes' });
  },

  async listOpportunities({ auth }: AuthOnly): Promise<Opportunity[]> {
    return listAll<Opportunity>({ auth, operation: 'list opportunities', path: '/opportunities', key: 'opportunities' });
  },

  async searchOpportunities({ auth }: AuthOnly): Promise<Opportunity[]> {
    return capsuleCrmClient.listOpportunities({ auth });
  },

  async searchOpportunitiesPage({ auth, searchTerm, page, perPage }: SearchPageParams): Promise<PageResult<Opportunity>> {
    const term = searchTerm?.trim() ?? '';
    return listPage<Opportunity>({
      auth,
      operation: 'search opportunities',
      path: term === '' ? '/opportunities' : '/opportunities/search',
      key: 'opportunities',
      query: { q: term === '' ? undefined : term },
      page,
      perPage,
    });
  },

  async getOpportunity({ auth, opportunityId }: { auth: CapsuleCrmAuthType; opportunityId: unknown }): Promise<Opportunity> {
    if (typeof opportunityId !== 'number' && typeof opportunityId !== 'string') {
      throw new Error('Capsule CRM get opportunity needs an opportunity ID.');
    }
    const response = await request<{ opportunity?: Opportunity }>({
      auth,
      operation: 'get opportunity',
      method: HttpMethod.GET,
      path: `/opportunities/${segment(opportunityId)}`,
      query: { embed: 'tags,fields' },
    });
    return unwrap({ body: response.body, key: 'opportunity', operation: 'get opportunity' });
  },

  async createOpportunity({ auth, params }: { auth: CapsuleCrmAuthType; params: CreateOpportunityParams }): Promise<Opportunity> {
    const response = await request<{ opportunity?: Opportunity }>({
      auth,
      operation: 'create opportunity',
      method: HttpMethod.POST,
      path: '/opportunities',
      body: { opportunity: params },
    });
    return unwrap({ body: response.body, key: 'opportunity', operation: 'create opportunity' });
  },

  async updateOpportunity({ auth, opportunityId, params }: { auth: CapsuleCrmAuthType; opportunityId: number | string; params: UpdateOpportunityParams }): Promise<Opportunity> {
    const response = await request<{ opportunity?: Opportunity }>({
      auth,
      operation: 'update opportunity',
      method: HttpMethod.PUT,
      path: `/opportunities/${segment(opportunityId)}`,
      body: { opportunity: params },
    });
    return unwrap({ body: response.body, key: 'opportunity', operation: 'update opportunity' });
  },

  async filterOpportunities({ auth, filter }: { auth: CapsuleCrmAuthType; filter: Filter }): Promise<Opportunity[]> {
    const response = await request<{ opportunities?: Opportunity[] }>({
      auth,
      operation: 'filter opportunities',
      method: HttpMethod.POST,
      path: '/opportunities/filters/results',
      body: { filter },
    });
    return response.body?.opportunities ?? [];
  },

  async listProjects({ auth }: AuthOnly): Promise<Project[]> {
    return listAll<Project>({ auth, operation: 'list projects', path: '/kases', key: 'kases' });
  },

  async listCases({ auth }: AuthOnly): Promise<Project[]> {
    return capsuleCrmClient.listProjects({ auth });
  },

  async searchProjects({ auth }: AuthOnly): Promise<Project[]> {
    return capsuleCrmClient.listProjects({ auth });
  },

  async searchProjectsPage({ auth, searchTerm, page, perPage }: SearchPageParams): Promise<PageResult<Project>> {
    const term = searchTerm?.trim() ?? '';
    return listPage<Project>({
      auth,
      operation: 'search projects',
      path: term === '' ? '/kases' : '/kases/search',
      key: 'kases',
      query: { q: term === '' ? undefined : term },
      page,
      perPage,
    });
  },

  async getProject({ auth, projectId }: { auth: CapsuleCrmAuthType; projectId: number | string }): Promise<Project> {
    const response = await request<{ kase?: Project }>({
      auth,
      operation: 'get project',
      method: HttpMethod.GET,
      path: `/kases/${segment(projectId)}`,
      query: { embed: 'tags,fields' },
    });
    return unwrap({ body: response.body, key: 'kase', operation: 'get project' });
  },

  async createProject({ auth, params }: { auth: CapsuleCrmAuthType; params: CreateProjectParams }): Promise<Project> {
    const response = await request<{ kase?: Project }>({
      auth,
      operation: 'create project',
      method: HttpMethod.POST,
      path: '/kases',
      body: { kase: params },
    });
    return unwrap({ body: response.body, key: 'kase', operation: 'create project' });
  },

  async filterProjects({ auth, filter }: { auth: CapsuleCrmAuthType; filter: Filter }): Promise<Project[]> {
    const response = await request<{ kases?: Project[] }>({
      auth,
      operation: 'filter projects',
      method: HttpMethod.POST,
      path: '/kases/filters/results',
      body: { filter },
    });
    return response.body?.kases ?? [];
  },

  async createEntry({ auth, params }: { auth: CapsuleCrmAuthType; params: CreateEntryParams }): Promise<Entry> {
    const response = await request<{ entry?: Entry }>({
      auth,
      operation: 'create note',
      method: HttpMethod.POST,
      path: '/entries',
      body: { entry: params },
    });
    return unwrap({ body: response.body, key: 'entry', operation: 'create note' });
  },

  async listEntriesPage({ auth, entity, entityId, page, perPage }: ListEntriesParams): Promise<PageResult<Entry>> {
    return listPage<Entry>({
      auth,
      operation: 'list entries',
      path: `/${ENTITY_PATHS[entity]}/${segment(entityId)}/entries`,
      key: 'entries',
      query: { embed: 'party,kase,opportunity' },
      page,
      perPage,
    });
  },

  async createTask({ auth, params }: { auth: CapsuleCrmAuthType; params: CreateTaskParams }): Promise<Task> {
    const response = await request<{ task?: Task }>({
      auth,
      operation: 'create task',
      method: HttpMethod.POST,
      path: '/tasks',
      body: { task: params },
    });
    return unwrap({ body: response.body, key: 'task', operation: 'create task' });
  },

  async updateTask({ auth, taskId, task }: { auth: CapsuleCrmAuthType; taskId: number | string; task: Record<string, unknown> }): Promise<Task> {
    const response = await request<{ task?: Task }>({
      auth,
      operation: 'update task',
      method: HttpMethod.PUT,
      path: `/tasks/${segment(taskId)}`,
      body: { task },
    });
    return unwrap({ body: response.body, key: 'task', operation: 'update task' });
  },

  async listTasksPage({ auth, status, page, perPage }: ListTasksParams): Promise<PageResult<Task>> {
    return listPage<Task>({
      auth,
      operation: 'list tasks',
      path: '/tasks',
      key: 'tasks',
      query: { status },
      page,
      perPage,
    });
  },

  async subscribeRestHook({ auth, params }: { auth: CapsuleCrmAuthType; params: CreateRestHookParams }): Promise<RestHook> {
    const response = await request<{ restHook?: RestHook }>({
      auth,
      operation: 'subscribe webhook',
      method: HttpMethod.POST,
      path: '/resthooks',
      body: { restHook: params },
    });
    return unwrap({ body: response.body, key: 'restHook', operation: 'subscribe webhook' });
  },

  async unsubscribeRestHook({ auth, hookId }: { auth: CapsuleCrmAuthType; hookId: number }): Promise<void> {
    try {
      await request<unknown>({
        auth,
        operation: 'unsubscribe webhook',
        method: HttpMethod.DELETE,
        path: `/resthooks/${segment(hookId)}`,
      });
    } catch (error) {
      if (error instanceof CapsuleCrmApiError && error.httpStatus === 404) {
        return;
      }
      throw error;
    }
  },
};

export class CapsuleCrmApiError extends Error {
  readonly httpStatus: number;
  readonly responseBody: unknown;

  constructor({ message, httpStatus, responseBody }: { message: string; httpStatus: number; responseBody: unknown }) {
    super(message);
    this.name = 'CapsuleCrmApiError';
    this.httpStatus = httpStatus;
    this.responseBody = responseBody;
  }
}

export const ENTITY_PATHS: Record<CapsuleEntity, string> = {
  party: 'parties',
  opportunity: 'opportunities',
  project: 'kases',
};

const EMPTY_TEXT_VALUES = new Set(['', '{}', '[]', 'null', 'undefined']);

export const CAPSULE_MAX_PER_PAGE = MAX_PER_PAGE;

export type CapsuleEntity = 'party' | 'opportunity' | 'project';

type CapsuleQuery = Record<string, string | number | undefined>;

type CapsuleRequest = {
  auth: CapsuleCrmAuthType;
  operation: string;
  method: HttpMethod;
  path: string;
  query?: CapsuleQuery;
  body?: unknown;
};

type CapsuleResponse<T> = {
  status: number;
  body: T | undefined;
  hasMore: boolean;
};

type ListPageParams = {
  auth: CapsuleCrmAuthType;
  operation: string;
  path: string;
  key: string;
  query?: CapsuleQuery;
  page: number;
  perPage: number;
};

type ListAllParams = {
  auth: CapsuleCrmAuthType;
  operation: string;
  path: string;
  key: string;
  query?: CapsuleQuery;
  maxPages?: number;
};

type AuthOnly = { auth: CapsuleCrmAuthType };

type EntityScoped = { auth: CapsuleCrmAuthType; entity: CapsuleEntity };

type SearchPageParams = {
  auth: CapsuleCrmAuthType;
  searchTerm?: string;
  page: number;
  perPage: number;
};

type ListEntriesParams = {
  auth: CapsuleCrmAuthType;
  entity: CapsuleEntity;
  entityId: number | string;
  page: number;
  perPage: number;
};

type ListTasksParams = {
  auth: CapsuleCrmAuthType;
  status?: string;
  page: number;
  perPage: number;
};

export type LinkTarget = { key: 'party' | 'opportunity' | 'kase'; id: number };

export type PageResult<T> = {
  items: T[];
  hasMore: boolean;
};
