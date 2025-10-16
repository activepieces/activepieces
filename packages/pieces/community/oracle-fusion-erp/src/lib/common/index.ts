import { OracleFusionAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';

export async function callOracleApi<T = any>(params: {
  auth: OracleFusionAuth;
  method: HttpMethod;
  resourcePath: string; // e.g. /fscmRestApi/resources/11.13.18.05/invoices
  query?: Record<string, string | number>;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<T> {
  const { auth, method, resourcePath, query, body, headers } = params;
  const url = new URL(`${auth.baseUrl}${resourcePath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: body && method !== HttpMethod.GET ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Oracle API ${res.status} ${res.statusText} ${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}
