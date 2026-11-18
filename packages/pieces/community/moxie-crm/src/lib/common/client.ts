import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { randomBytes } from 'crypto';
import {
  ClientCreateRequest,
  ClientListResponse,
  ContactCreateRequest,
  MoxieCredentials,
  ProjectCreateRequest,
  ProjectSearchResponse,
  ProjectTaskStageListResponse,
  TaskCreateRequest,
} from './models';

export const MOXIE_SETTINGS_PATH =
  'Workspace Settings > Connected Apps > Integrations > Custom Integration';

export const MOXIE_BASE_URL_EXAMPLE = 'https://pod01.withmoxie.com/api/public';

export class MoxieApiError extends Error {
  readonly status: number | undefined;
  readonly responseBody: unknown;

  constructor({
    message,
    status,
    responseBody,
  }: {
    message: string;
    status?: number;
    responseBody?: unknown;
  }) {
    super(message);
    this.name = 'MoxieApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function normalizeBaseUrl({ baseUrl }: { baseUrl: unknown }): string {
  const raw = typeof baseUrl === 'string' ? baseUrl.trim() : '';
  const hint = `Copy the Base URL from ${MOXIE_SETTINGS_PATH} (for example ${MOXIE_BASE_URL_EXAMPLE}).`;
  if (raw === '') {
    throw new MoxieApiError({ message: `The Moxie Base URL is empty. ${hint}` });
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new MoxieApiError({ message: `The Moxie Base URL "${raw}" is not a valid URL. ${hint}` });
  }
  const host = parsed.hostname.toLowerCase();
  const isMoxieHost = host === 'withmoxie.com' || host.endsWith('.withmoxie.com');
  if (
    parsed.protocol !== 'https:' ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.port !== '' ||
    parsed.search !== '' ||
    parsed.hash !== '' ||
    !isMoxieHost
  ) {
    throw new MoxieApiError({
      message: `The Moxie Base URL must be an https address on withmoxie.com, with no user name, port or query. ${hint}`,
    });
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
}

export function assertMoxieRequestUrl({ baseUrl, url }: { baseUrl: unknown; url: unknown }): void {
  const base = new URL(normalizeBaseUrl({ baseUrl }));
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
    return;
  }
  let target: URL;
  try {
    target = new URL(url.trim());
  } catch {
    throw new MoxieApiError({ message: `The URL "${url}" is not a valid URL.` });
  }
  if (target.origin !== base.origin || target.username !== '' || target.password !== '') {
    throw new MoxieApiError({
      message: `Custom API Call only sends the Moxie API key to your Base URL host (${base.origin}). Use a path such as /action/clients/list instead of a full URL on another host.`,
    });
  }
}

export function moxieHeaders({ apiKey }: { apiKey: string }): Record<string, string> {
  return { 'X-API-KEY': apiKey.trim() };
}

export function responseStatusOf({ error }: { error: unknown }): number | undefined {
  if (error instanceof MoxieApiError) {
    return error.status;
  }
  const response = responseOf({ error });
  return response?.status;
}

export function looksLikeWebPage({
  headers,
  body,
}: {
  headers: Record<string, unknown> | undefined;
  body: unknown;
}): boolean {
  const contentType = headerValue({ headers, name: 'content-type' }) ?? '';
  if (contentType.toLowerCase().includes('text/html')) {
    return true;
  }
  return typeof body === 'string' && body.trimStart().startsWith('<');
}

export async function moxieRequest<T extends HttpMessageBody>({
  credentials,
  method,
  path,
  body,
  query,
  notFoundMessage,
  contentType,
}: MoxieRequest): Promise<T> {
  const baseUrl = normalizeBaseUrl({ baseUrl: credentials.baseUrl });
  const queryParams = toQueryParams({ query });
  const response = await httpClient
    .sendRequest<T>({
      method,
      url: `${baseUrl}${path}`,
      headers: {
        ...moxieHeaders({ apiKey: credentials.apiKey }),
        ...(contentType === undefined ? {} : { 'Content-Type': contentType }),
      },
      body,
      queryParams,
    })
    .catch((error: unknown) => {
      throw toMoxieError({ error, notFoundMessage });
    });
  if (looksLikeWebPage({ headers: response.headers, body: response.body })) {
    throw new MoxieApiError({
      message: `Moxie returned a web page instead of API data. Check the connection's Base URL: copy it from ${MOXIE_SETTINGS_PATH} (for example ${MOXIE_BASE_URL_EXAMPLE}).`,
      status: response.status,
    });
  }
  return response.body;
}

export function multipartFileBody({ fieldName, filename, data }: { fieldName: string; filename: string; data: Buffer }): {
  body: Buffer;
  contentType: string;
} {
  const boundary = `----moxie${randomBytes(12).toString('hex')}`;
  const safeName = filename.replace(/["\\\r\n]/g, '_');
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${safeName}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return { body: Buffer.concat([head, data, tail]), contentType: `multipart/form-data; boundary=${boundary}` };
}

export class MoxieCRMClient {
  private readonly credentials: MoxieCredentials;

  constructor({ baseUrl, apiKey }: MoxieCredentials) {
    this.credentials = { baseUrl, apiKey };
  }

  request<T extends HttpMessageBody>(params: Omit<MoxieRequest, 'credentials'>): Promise<T> {
    return moxieRequest<T>({ ...params, credentials: this.credentials });
  }

  createContact(request: ContactCreateRequest): Promise<unknown> {
    return this.request({ method: HttpMethod.POST, path: '/action/contacts/create', body: request });
  }

  createClient(request: ClientCreateRequest): Promise<unknown> {
    return this.request({ method: HttpMethod.POST, path: '/action/clients/create', body: request });
  }

  listClients(): Promise<ClientListResponse[]> {
    return this.request<ClientListResponse[]>({ method: HttpMethod.GET, path: '/action/clients/list' });
  }

  listInvoiceTemplates(): Promise<string[]> {
    return this.request<string[]>({ method: HttpMethod.GET, path: '/action/invoiceTemplates/list' });
  }

  createProject(request: ProjectCreateRequest): Promise<unknown> {
    return this.request({ method: HttpMethod.POST, path: '/action/projects/create', body: request });
  }

  createTask(request: TaskCreateRequest): Promise<unknown> {
    return this.request({ method: HttpMethod.POST, path: '/action/tasks/create', body: request });
  }

  searchProjects({ query, id }: { query?: string; id?: string }): Promise<ProjectSearchResponse[]> {
    return this.request<ProjectSearchResponse[]>({
      method: HttpMethod.GET,
      path: '/action/projects/search',
      query: { query, id },
      notFoundMessage:
        query !== undefined && query !== ''
          ? `No client named "${query}" in this Moxie workspace. The query must be the exact client name.`
          : undefined,
    });
  }

  listProjectTaskStages({ projectTypeId }: { projectTypeId?: string } = {}): Promise<ProjectTaskStageListResponse[]> {
    return this.request<ProjectTaskStageListResponse[]>({
      method: HttpMethod.GET,
      path: '/action/taskStages/list',
      query: { projectTypeId },
    });
  }

  searchClients({ query, id }: { query?: string; id?: string }): Promise<unknown> {
    return this.request({ method: HttpMethod.GET, path: '/action/clients/search', query: { query, id } });
  }

  searchContacts({ query, id }: { query?: string; id?: string } = {}): Promise<unknown> {
    return this.request({ method: HttpMethod.GET, path: '/action/contacts/search', query: { query, id } });
  }

  listPipelineStages(): Promise<unknown> {
    return this.request({ method: HttpMethod.GET, path: '/action/pipelineStages/list' });
  }

  listWorkspaceUsers(): Promise<unknown> {
    return this.request({ method: HttpMethod.GET, path: '/action/users/list' });
  }
}

function toQueryParams({ query }: { query: MoxieQuery | undefined }): QueryParams | undefined {
  if (query === undefined) {
    return undefined;
  }
  const result: QueryParams = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    const text = String(value);
    if (text.trim() === '') {
      continue;
    }
    result[key] = text;
  }
  return Object.keys(result).length === 0 ? undefined : result;
}

function responseOf({ error }: { error: unknown }): { status?: number; body?: unknown } | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (typeof response !== 'object' || response === null) {
    return undefined;
  }
  const status: unknown = Reflect.get(response, 'status');
  return {
    status: typeof status === 'number' ? status : undefined,
    body: Reflect.get(response, 'body'),
  };
}

function headerValue({
  headers,
  name,
}: {
  headers: Record<string, unknown> | undefined;
  name: string;
}): string | undefined {
  if (headers === undefined) {
    return undefined;
  }
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== name) {
      continue;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
  }
  return undefined;
}

function vendorMessage({ body }: { body: unknown }): string | undefined {
  if (typeof body === 'string') {
    const text = body.trim();
    if (text === '') {
      return undefined;
    }
    if (text.startsWith('<')) {
      return 'the server answered with a web page';
    }
    return text.slice(0, 300);
  }
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  for (const key of ['message', 'detail', 'error']) {
    const value: unknown = Reflect.get(body, key);
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim().slice(0, 300);
    }
  }
  return undefined;
}

function toMoxieError({
  error,
  notFoundMessage,
}: {
  error: unknown;
  notFoundMessage: string | undefined;
}): Error {
  if (error instanceof MoxieApiError) {
    return error;
  }
  const response = responseOf({ error });
  if (response?.status === undefined) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const { status, body } = response;
  const detail = vendorMessage({ body });
  const suffix = detail === undefined ? '' : ` Moxie said: ${detail}`;
  let message: string;
  if (status === 401) {
    message = `Moxie rejected the API key (HTTP 401). Copy the API Key again from ${MOXIE_SETTINGS_PATH}.${suffix}`;
  } else if (status === 403) {
    message = `Moxie refused access (HTTP 403). Check that the API key belongs to this workspace.${suffix}`;
  } else if (status === 404 && detail !== undefined && detail.startsWith('No endpoint')) {
    message = `Moxie does not know this API route (HTTP 404). Check the connection's Base URL: it should look like ${MOXIE_BASE_URL_EXAMPLE}.${suffix}`;
  } else if (status === 404) {
    message = `${notFoundMessage ?? 'Moxie could not find the requested record (HTTP 404).'}${suffix}`;
  } else if (status === 412) {
    message = `Moxie rejected the request because a required value is missing or invalid (HTTP 412).${suffix}`;
  } else if (status === 400) {
    message = `Moxie rejected the request body (HTTP 400).${suffix}`;
  } else if (status === 429) {
    message = `Moxie is rate limiting this workspace (HTTP 429). Wait a few minutes before retrying, or space out the requests.${suffix}`;
  } else {
    message = `Moxie request failed (HTTP ${status}).${suffix}`;
  }
  return new MoxieApiError({ message, status, responseBody: body });
}

type MoxieQuery = Record<string, string | number | boolean | undefined | null>;

type MoxieRequest = {
  credentials: MoxieCredentials;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: MoxieQuery;
  notFoundMessage?: string;
  contentType?: string;
};
