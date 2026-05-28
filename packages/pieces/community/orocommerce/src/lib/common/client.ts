import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  HttpError,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { tryCatchSync } from '@activepieces/shared';

import {
  type OroAuth,
  type OroAuthResponseType,
  type OroApiCallParams,
  type OroJsonApiItem,
  type OroJsonApiCollection,
  type FetchCollectionParams,
} from './types';
import { jsonApiBodyUtils } from './jsonapi-body-utils';

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function buildCacheKey({ auth }: { auth: OroAuth }): string {
  return `${auth.props.serverUrl}::${auth.props.clientId}`;
}

function formatError({ error }: { error: unknown }): string {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const body = error.response.body;
    const detail = typeof body === 'object' && body !== null
      ? JSON.stringify(body)
      : String(body ?? '');
    return `OroCommerce API Error (${status}): ${detail}`;
  }
  if (error instanceof Error) {
    return `OroCommerce API Error: ${error.message}`;
  }
  return `OroCommerce API Error: ${String(error)}`;
}

export function getOroBaseUrl({ auth }: { auth: OroAuth }): string {
  const serverUrl = auth.props.serverUrl.replace(/\/*$/, '');
  const adminPrefix = auth.props.adminPrefix.replace(/^\/+|\/+$/g, '');
  return `${serverUrl}/${adminPrefix}/api`;
}

export async function getAccessToken({ auth }: { auth: OroAuth }): Promise<string> {
  const cacheKey = buildCacheKey({ auth });
  const cached = tokenCache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const baseUrl = auth.props.serverUrl.replace(/\/*$/, '');
  const response = await httpClient.sendRequest<OroAuthResponseType>({
    method: HttpMethod.POST,
    url: `${baseUrl}/oauth2-token`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: auth.props.clientId,
      client_secret: auth.props.clientSecret,
    }).toString(),
  });

  const token = response.body.access_token;
  tokenCache.set(cacheKey, {
    token,
    expiresAt: Date.now() + response.body.expires_in * 1000 - 30_000,
  });

  return token;
}

export async function oroApiCall({
  method,
  resourceUri,
  auth,
  queryParams,
  body,
  headers: extraHeaders,
}: OroApiCallParams): Promise<HttpResponse<HttpMessageBody>> {
  try {
    const resource = resourceUri.replace(/^\/+/, '');
    const sanitizedBody = sanitizeJsonApiBody({ body });
    const connectionHeaders = parseConnectionHeaders({ raw: auth.props.headers });

    return await httpClient.sendRequest({
      method,
      url: `${getOroBaseUrl({ auth })}/${resource}`,
      headers: {
        ...connectionHeaders,
        ...extraHeaders,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken({ auth }),
      },
      queryParams,
      body: sanitizedBody,
    });
  } catch (error: unknown) {
    throw new Error(formatError({ error }));
  }
}

export async function fetchCollection({
  auth,
  resourceUri,
  queryParams,
}: FetchCollectionParams): Promise<OroJsonApiItem[]> {
  const response = await oroApiCall({
    method: HttpMethod.GET,
    resourceUri,
    auth,
    queryParams: { 'page[size]': '50', ...queryParams },
  });

  const body = response.body as OroJsonApiCollection | undefined;
  return body?.data ?? [];
}

function sanitizeJsonApiBody({ body }: { body: unknown }): unknown {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }
  const record = body as Record<string, unknown>;
  if (!('data' in record) || typeof record['data'] !== 'object' || record['data'] === null) {
    return body;
  }
  return {
    ...record,
    data: jsonApiBodyUtils.omitEmptyObjects(record['data'] as Record<string, unknown>),
  };
}

function toStringRecord({ obj }: { obj: Record<string, unknown> | undefined }): Record<string, string> {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, String(v)]),
  );
}

function parseConnectionHeaders({ raw }: { raw: string | null | undefined }): Record<string, string> {
  if (!raw) return {};
  const { data, error } = tryCatchSync(() => JSON.parse(raw) as unknown);
  if (error || typeof data !== 'object' || data === null || Array.isArray(data)) return {};
  return toStringRecord({ obj: data as Record<string, unknown> });
}

