import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { LINKLY_API_BASE } from '../auth';

export async function linklyApiCall<T extends HttpMessageBody>({
  token,
  method,
  path,
  query,
  body,
}: LinklyApiCallParams): Promise<T> {
  const queryParams: QueryParams = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      queryParams[key] = String(value);
    }
  }
  const request: HttpRequest = {
    method,
    url: `${LINKLY_API_BASE}${path}`,
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    queryParams,
    body,
  };
  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (e: unknown) {
    throw new Error(describeLinklyError(e));
  }
}

export function authToken(auth: unknown): string {
  if (typeof auth === 'object' && auth !== null && 'secret_text' in auth) {
    const value = Reflect.get(auth, 'secret_text');
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  if (typeof auth === 'string' && auth.trim() !== '') {
    return auth.trim();
  }
  throw new Error('Connect your Linkly account first.');
}

export function compact(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function describeLinklyError(e: unknown): string {
  if (typeof e !== 'object' || e === null) {
    return 'Linkly API error';
  }
  const response = 'response' in e ? Reflect.get(e, 'response') : undefined;
  const status =
    typeof response === 'object' && response !== null && 'status' in response
      ? Reflect.get(response, 'status')
      : undefined;
  const body =
    typeof response === 'object' && response !== null && 'body' in response
      ? Reflect.get(response, 'body')
      : undefined;
  const detail =
    typeof body === 'object' && body !== null && 'error' in body
      ? String(Reflect.get(body, 'error'))
      : typeof body === 'string'
      ? body
      : body !== undefined
      ? JSON.stringify(body)
      : 'message' in e
      ? String(Reflect.get(e, 'message'))
      : 'Unknown error';
  switch (status) {
    case 401:
      return 'Linkly rejected the API key (401). Check the connection.';
    case 403:
      return `Linkly refused the request (403): ${detail}. Your plan or role may not allow this action.`;
    case 404:
      return `Linkly could not find that resource (404): ${detail}. Check the workspace and link IDs.`;
    case 429:
      return 'Linkly rate limit exceeded (429). Wait a moment and retry.';
    default:
      return `Linkly API error (${status ?? 'no status'}): ${detail}`;
  }
}

export type LinklyApiCallParams = {
  token: string;
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export type LinklyWorkspace = {
  id: number;
  name: string;
};

export type LinklyDomain = {
  id?: number;
  name: string;
};

export type LinklyLink = {
  id: number;
  workspace_id: number;
  name: string | null;
  url: string;
  full_url: string;
  domain: string | null;
  slug: string | null;
  enabled: boolean;
  clicks_total?: number;
  [key: string]: unknown;
};

export type LinklyLinkList = {
  links: LinklyLink[];
  page_number: number;
  page_size: number;
  total_entries: number;
  total_pages: number;
};
