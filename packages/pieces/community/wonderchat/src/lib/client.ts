import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';
import { WONDERCHAT_BASE_URL, authHeader } from './common';

export async function wcRequest<T>(args: {
  apiKey: string;
  method: HttpMethod;
  url: string; // path starting with /
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
}) {
  const req: HttpRequest = {
    method: args.method,
    url: `${WONDERCHAT_BASE_URL}${args.url}`,
    queryParams: args.query,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(args.apiKey),
      ...(args.headers ?? {}),
    },
    body: args.body,
  };
  const res = await httpClient.sendRequest<T>(req);
  return res.body as T;
}