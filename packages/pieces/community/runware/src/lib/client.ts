import {
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';

export const RUNWARE_BASE_URL ='https://api.runware.ai';

export function authHeaders(apiKey: string): Record<string, string> {
  
  return {
    Authorization: `Bearer ${apiKey}`,
    'x-api-key': apiKey,
  };
}

export async function runwareRequest<T>(args: {
  apiKey: string;
  method: HttpMethod;
  url: string;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  baseUrl?: string;
}): Promise<T> {
  const base = args.baseUrl ?? RUNWARE_BASE_URL;
  const isAbsolute = args.url.startsWith('http://') || args.url.startsWith('https://');

  const req: HttpRequest = {
    method: args.method,
    url: isAbsolute ? args.url : `${base}${args.url}`,
    queryParams: args.query,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(args.apiKey),
      ...(args.headers ?? {}),
    },
    body: args.body,
  };

  const res = await httpClient.sendRequest<T>(req);

  if (res.status >= 400) {
    const details =
      typeof res.body === 'string'
        ? res.body
        : JSON.stringify(res.body ?? {}, null, 2);
    throw new Error(
      `Runware API error (${res.status}) for ${args.method} ${args.url}: ${details}`
    );
  }

  return res.body as T;
}


export function compactObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') {
      (out as any)[k] = v;
    }
  }
  return out;
}