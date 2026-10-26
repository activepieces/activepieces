import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

async function getCatalog(): Promise<ApiverveCatalog> {
  if (!catalogRequest) {
    catalogRequest = httpClient
      .sendRequest<ApiverveCatalog>({
        method: HttpMethod.GET,
        url: APIVERVE_CATALOG_URL,
      })
      .then((response) => response.body)
      .catch((error: unknown) => {
        catalogRequest = null;
        throw error;
      });
  }
  return catalogRequest;
}

async function getApi(apiId: string): Promise<ApiverveCatalogApi> {
  const catalog = await getCatalog();
  const api = catalog.apis[apiId];
  if (!api) {
    throw new Error(`Unknown APIVerve API "${apiId}". Pick an API from the list again.`);
  }
  return api;
}

function errorMessageFrom(error: unknown): string {
  if (error instanceof HttpError) {
    const body = error.response.body;
    if (body && typeof body === 'object') {
      const message = 'message' in body ? body.message : undefined;
      const detail = 'error' in body ? body.error : undefined;
      if (typeof message === 'string' && message.length > 0) {
        return `APIVerve returned ${error.response.status}: ${message}`;
      }
      if (typeof detail === 'string' && detail.length > 0) {
        return `APIVerve returned ${error.response.status}: ${detail}`;
      }
    }
    return `APIVerve returned ${error.response.status}.`;
  }
  return error instanceof Error ? error.message : String(error);
}

async function callApiverve({
  apiKey,
  path,
  method,
  query,
  body,
}: {
  apiKey: string;
  path: string;
  method: HttpMethod;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
}): Promise<unknown> {
  try {
    const response = await httpClient.sendRequest<ApiverveResponse>({
      method,
      url: `${APIVERVE_BASE_URL}${path}`,
      headers: { 'x-api-key': apiKey },
      queryParams: query,
      body,
    });
    return response.body.data ?? response.body;
  } catch (error) {
    throw new Error(errorMessageFrom(error));
  }
}

function toQuery(values: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : String(value)])
  );
}

function coerceValue({ param, raw }: { param: ApiverveCatalogParam; raw: unknown }): unknown {
  switch (param.type) {
    case 'integer':
    case 'number': {
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) {
        throw new Error(`"${param.name}" must be a number.`);
      }
      return parsed;
    }
    case 'boolean':
      return raw === true || raw === 'true';
    case 'array':
      return Array.isArray(raw) ? raw : String(raw).split(',').map((item) => item.trim());
    case 'object':
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    default:
      return String(raw);
  }
}

async function runCatalogApi({
  apiKey,
  apiId,
  values,
}: {
  apiKey: string;
  apiId: string;
  values: Record<string, unknown>;
}): Promise<unknown> {
  const api = await getApi(apiId);
  const provided = api.params
    .filter((param) => {
      const raw = values[param.name];
      return raw !== undefined && raw !== null && raw !== '';
    })
    .map((param) => ({ param, value: coerceValue({ param, raw: values[param.name] }) }));
  const query = Object.fromEntries(
    provided.filter(({ param }) => param.in === 'query').map(({ param, value }) => [param.name, value])
  );
  const body = Object.fromEntries(
    provided.filter(({ param }) => param.in === 'body').map(({ param, value }) => [param.name, value])
  );
  const method = api.method.toUpperCase() === 'POST' ? HttpMethod.POST : HttpMethod.GET;
  return callApiverve({
    apiKey,
    path: api.path,
    method,
    query: toQuery(query),
    body: method === HttpMethod.POST ? body : undefined,
  });
}

function labelFor(name: string): string {
  const spaced = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

let catalogRequest: Promise<ApiverveCatalog> | null = null;

export const APIVERVE_BASE_URL = 'https://api.apiverve.com';
export const APIVERVE_CATALOG_URL = 'https://assets.apiverve.com/cli-manifest.json';

export type ApiverveCatalogParam = {
  name: string;
  in: 'query' | 'body';
  required: boolean;
  type: string;
  description: string;
  example?: unknown;
};

export type ApiverveCatalogApi = {
  title: string;
  description: string;
  category: string;
  method: string;
  path: string;
  params: ApiverveCatalogParam[];
};

export type ApiverveCatalog = {
  apis: Record<string, ApiverveCatalogApi>;
};

type ApiverveResponse = {
  status?: string;
  error?: string | null;
  data?: unknown;
};

export const apiverveCommon = {
  getCatalog,
  getApi,
  callApiverve,
  runCatalogApi,
  toQuery,
  labelFor,
};
