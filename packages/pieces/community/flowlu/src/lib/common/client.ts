import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { FlowluEntity, FlowluModule } from './constants';
import {
  Account,
  AccountCategory,
  AccountHonorificTitle,
  AccountIndustry,
  ListAPIResponse,
  Opportunity,
  OpportunitySource,
  Pipeline,
  PipelineStage,
  Task,
  TaskWorkflow,
  TaskWorkflowStage,
  User,
} from './types';

export class FlowluApiError extends Error {
  readonly status: number | undefined;
  readonly errorCode: number | undefined;
  readonly responseBody: unknown;

  constructor({
    message,
    status,
    errorCode,
    responseBody,
  }: {
    message: string;
    status?: number;
    errorCode?: number;
    responseBody?: unknown;
  }) {
    super(message);
    this.name = 'FlowluApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.responseBody = responseBody;
  }
}

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeDomain(raw: unknown): string {
  const text = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  const slug = text
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .replace(/\.flowlu\.com$/, '');
  if (!SLUG.test(slug)) {
    throw new FlowluApiError({
      message:
        'The Flowlu Domain must be your portal name only, for example "example" for https://example.flowlu.com.',
    });
  }
  return slug;
}

export type FormValue = string | number | boolean | null | undefined;

export function toFormBody(fields: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (typeof value === 'boolean') {
      params.append(key, value ? '1' : '0');
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new FlowluApiError({
          message: `Field "${key}" must be a finite number.`,
        });
      }
      params.append(key, String(value));
    } else if (typeof value === 'string') {
      params.append(key, value);
    } else {
      throw new FlowluApiError({
        message: `Field "${key}" must be text, a number or a boolean.`,
      });
    }
  }
  return params.toString();
}

function cleanQuery(query: Record<string, FormValue> | undefined): QueryParams {
  const params: QueryParams = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params[key] =
      typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
  }
  return params;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function short(text: string): string {
  return text.length > 300 ? `${text.slice(0, 300)}…` : text;
}

export function flowluErrorOf(body: unknown): FlowluApiError | undefined {
  if (
    !isRecord(body) ||
    body['error'] === undefined ||
    body['error'] === null
  ) {
    return undefined;
  }
  const error = body['error'];
  if (isRecord(error)) {
    const code =
      typeof error['error_code'] === 'number'
        ? error['error_code']
        : Number(error['error_code']);
    const msg =
      typeof error['error_msg'] === 'string'
        ? error['error_msg']
        : 'unknown error';
    const errorCode = Number.isFinite(code) ? code : undefined;
    let message = `Flowlu error ${errorCode ?? '?'}: ${msg}.`;
    if (errorCode === 11) {
      message = `Flowlu rejected the connection (error 11: ${msg}). Check the API key and the Domain.`;
    } else if (errorCode === 20) {
      message = `Flowlu could not find the record (error 20: ${msg}). Check the ID.`;
    }
    return new FlowluApiError({
      message,
      status: 200,
      errorCode,
      responseBody: body,
    });
  }
  const details = isRecord(body['details'])
    ? Object.entries(body['details'])
        .map(
          ([field, text]) =>
            `${field}: ${
              typeof text === 'string' ? text : JSON.stringify(text)
            }`
        )
        .join('; ')
    : '';
  const description =
    typeof body['description'] === 'string' ? body['description'] : '';
  const kind = typeof error === 'string' ? error : 'error';
  const message =
    kind === 'validation'
      ? `Flowlu validation error: ${
          details || description || 'the request was rejected'
        }.`
      : `Flowlu error: ${short(
          [kind, description, details].filter((p) => p !== '').join(' - ')
        )}.`;
  return new FlowluApiError({ message, status: 200, responseBody: body });
}

export function httpResponseOf(
  error: unknown
): { status: number; body: unknown } | undefined {
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return undefined;
  }
  return { status: response['status'], body: response['body'] };
}

function httpFailure({
  status,
  body,
}: {
  status: number;
  body: unknown;
}): FlowluApiError {
  const vendor = flowluErrorOf(body);
  const text = vendor
    ? vendor.message
    : typeof body === 'string'
    ? short(body)
    : body === undefined
    ? ''
    : short(JSON.stringify(body));
  let message = `Flowlu request failed with HTTP ${status}${
    text ? `: ${text}` : '.'
  }`;
  if (status === 429) {
    message =
      'Flowlu rate limit reached (HTTP 429) after 3 retries. Your Flowlu plan limits requests per second; try again later.';
  } else if (status === 401 || status === 403) {
    message = `Flowlu refused the request (HTTP ${status}). Check that the API key is valid and has access to this module.`;
  }
  return new FlowluApiError({
    message,
    status,
    errorCode: vendor?.errorCode,
    responseBody: body,
  });
}

export const RETRY_DELAYS_MS = [1000, 2000, 4000];

const REQUEST_TIMEOUT_MS = 20000;

export const flowluTiming = {
  sleep: (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
};

export type ListEnvelope<T> = {
  total?: number;
  total_result?: number;
  page?: number;
  count?: number;
  items: T[];
};

export class FlowluClient {
  private readonly slug: string;
  private readonly apiKey: string;

  constructor(domain: string, apiKey: string) {
    this.slug = normalizeDomain(domain);
    this.apiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (this.apiKey === '') {
      throw new FlowluApiError({
        message:
          'The Flowlu API key is empty. Paste the key from Portal Settings > API Settings.',
      });
    }
  }

  get baseUrl(): string {
    return `https://${this.slug}.flowlu.com/api/v1/module`;
  }

  async request<T extends HttpMessageBody>({
    method,
    path,
    query,
    body,
  }: {
    method: HttpMethod;
    path: string;
    query?: Record<string, FormValue>;
    body?: object;
  }): Promise<T> {
    if (!/^\/[a-z_]+\/[a-z_]+(\/[a-z_]+(\/\d+)?)?$/.test(path)) {
      throw new FlowluApiError({ message: `Invalid Flowlu API path ${path}.` });
    }
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await httpClient.sendRequest<T>({
          method,
          url: `${this.baseUrl}${path}`,
          headers:
            body === undefined
              ? undefined
              : { 'Content-Type': 'application/x-www-form-urlencoded' },
          queryParams: { ...cleanQuery(query), api_key: this.apiKey },
          body: body === undefined ? undefined : toFormBody(body),
          followRedirects: false,
          timeout: REQUEST_TIMEOUT_MS,
        });
        const payload: unknown = res.body;
        if (res.status >= 300) {
          throw new FlowluApiError({
            message: `Flowlu redirected the request (HTTP ${res.status}). Check that the Domain is your portal name, for example "example" for https://example.flowlu.com.`,
            status: res.status,
          });
        }
        const vendor = flowluErrorOf(payload);
        if (vendor) {
          throw vendor.errorCode === 11
            ? new FlowluApiError({
                message: `${vendor.message} The request went to https://${this.slug}.flowlu.com.`,
                status: vendor.status,
                errorCode: vendor.errorCode,
                responseBody: vendor.responseBody,
              })
            : vendor;
        }
        if (!isRecord(payload)) {
          throw new FlowluApiError({
            message:
              'Flowlu returned an unexpected response (not a JSON object). Check the Domain.',
            status: res.status,
            responseBody:
              typeof payload === 'string' ? short(payload) : payload,
          });
        }
        return res.body;
      } catch (error) {
        if (error instanceof FlowluApiError) {
          throw error;
        }
        const response = httpResponseOf(error);
        if (response === undefined) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new FlowluApiError({
              message: `Flowlu did not answer within ${
                REQUEST_TIMEOUT_MS / 1000
              } seconds. Try again later.`,
            });
          }
          throw error;
        }
        if (response.status === 429 && attempt < RETRY_DELAYS_MS.length) {
          await flowluTiming.sleep(RETRY_DELAYS_MS[attempt]);
          continue;
        }
        throw httpFailure(response);
      }
    }
  }

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    query?: Record<string, FormValue>,
    body: object | undefined = undefined
  ): Promise<T> {
    return this.request<T>({ method, path: resourceUri, query, body });
  }

  async getRecord<T = Record<string, unknown>>(
    module: string,
    entity: string,
    id: number
  ): Promise<T> {
    const res = await this.request<{ response: T }>({
      method: HttpMethod.GET,
      path: `/${module}/${entity}/get/${id}`,
    });
    return res.response;
  }

  async createRecord<T = Record<string, unknown>>(
    module: string,
    entity: string,
    body: Record<string, unknown>
  ): Promise<T> {
    const res = await this.request<{ response: T }>({
      method: HttpMethod.POST,
      path: `/${module}/${entity}/create`,
      body,
    });
    return res.response;
  }

  async updateRecord<T = Record<string, unknown>>(
    module: string,
    entity: string,
    id: number,
    body: Record<string, unknown>
  ): Promise<T> {
    const res = await this.request<{ response: T }>({
      method: HttpMethod.POST,
      path: `/${module}/${entity}/update/${id}`,
      body,
    });
    return res.response;
  }

  async deleteRecord(
    module: string,
    entity: string,
    id: number
  ): Promise<{ id: string | number }> {
    const res = await this.request<{ response: { id: string | number } }>({
      method: HttpMethod.GET,
      path: `/${module}/${entity}/delete/${id}`,
    });
    return res.response;
  }

  async list<T = Record<string, unknown>>(
    module: string,
    entity: string,
    query?: Record<string, FormValue>
  ): Promise<ListEnvelope<T>> {
    const res = await this.request<{ response: ListEnvelope<T> }>({
      method: HttpMethod.GET,
      path: `/${module}/${entity}/list`,
      query,
    });
    const envelope = res.response;
    if (!isRecord(envelope) || !Array.isArray(envelope.items)) {
      throw new FlowluApiError({
        message: 'Flowlu returned a list without items.',
        responseBody: res,
      });
    }
    return envelope;
  }

  async createAccount(request: object) {
    return await this.makeRequest<RecordResponse>(
      HttpMethod.POST,
      '/crm/account/create',
      undefined,
      request
    );
  }
  async updateContact(id: number, request: object) {
    return await this.makeRequest<RecordResponse>(
      HttpMethod.POST,
      `/crm/account/update/${id}`,
      undefined,
      request
    );
  }
  async listAllAccounts(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<Account[]>>(
      HttpMethod.GET,
      '/crm/account/list',
      query
    );
  }
  async listAllContacts(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<Account[]>>(
      HttpMethod.GET,
      '/crm/account/list',
      {
        ...query,
        'filter[type]': '2',
      }
    );
  }
  async createTask(request: object) {
    return await this.makeRequest<RecordResponse>(
      HttpMethod.POST,
      '/task/tasks/create',
      undefined,
      request
    );
  }
  async updateTask(id: number, request: object) {
    return await this.makeRequest<RecordResponse>(
      HttpMethod.POST,
      `/task/tasks/update/${id}`,
      undefined,
      request
    );
  }
  async getTask(id: number) {
    return await this.makeRequest<RecordResponse>(
      HttpMethod.GET,
      `/task/tasks/get/${id}`
    );
  }
  async listAllTasks(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<Task[]>>(
      HttpMethod.GET,
      '/task/tasks/list',
      query
    );
  }
  async createOpportunity(request: object) {
    return await this.makeRequest<RecordResponse>(
      HttpMethod.POST,
      '/crm/lead/create',
      undefined,
      request
    );
  }
  async updateOpportunity(id: number, request: object) {
    return await this.makeRequest<RecordResponse>(
      HttpMethod.POST,
      `/crm/lead/update/${id}`,
      undefined,
      request
    );
  }
  async listAllOpportunities(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<Opportunity[]>>(
      HttpMethod.GET,
      '/crm/lead/list',
      query
    );
  }
  async listAllUsers(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<User[]>>(
      HttpMethod.GET,
      '/core/user/list',
      query
    );
  }
  async listAllTaskWorkflow(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<TaskWorkflow[]>>(
      HttpMethod.GET,
      '/task/workflows/list',
      query
    );
  }
  async listAllTaskStages(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<TaskWorkflowStage[]>>(
      HttpMethod.GET,
      '/task/stages/list',
      query
    );
  }
  async listAllHonorificTitles(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<AccountHonorificTitle[]>>(
      HttpMethod.GET,
      '/crm/honorific_title/list',
      query
    );
  }
  async listAllAccountCategories(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<AccountCategory[]>>(
      HttpMethod.GET,
      '/crm/account_category/list',
      query
    );
  }
  async listAllAccountIndustries(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<AccountIndustry[]>>(
      HttpMethod.GET,
      '/crm/industry/list',
      query
    );
  }
  async listAllOpportunitySources(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<OpportunitySource[]>>(
      HttpMethod.GET,
      '/crm/source/list',
      query
    );
  }
  async listSalesPipelines(query?: Record<string, FormValue>) {
    return await this.makeRequest<ListAPIResponse<Pipeline[]>>(
      HttpMethod.GET,
      '/crm/pipeline/list',
      query
    );
  }
  async listSalesPipelineStages(
    pipeline_id: number,
    query?: Record<string, FormValue>
  ) {
    return await this.makeRequest<ListAPIResponse<PipelineStage[]>>(
      HttpMethod.GET,
      '/crm/pipeline_stage/list',
      {
        ...query,
        'filter[pipeline_id]': pipeline_id.toString(),
      }
    );
  }

  async deleteAction(
    moduleName: FlowluModule,
    entityName: FlowluEntity,
    id: number
  ) {
    return await this.makeRequest<RecordResponse>(
      HttpMethod.GET,
      `/${moduleName}/${entityName}/delete/${id}`
    );
  }
}

export type RecordResponse = { response: Record<string, unknown> };
