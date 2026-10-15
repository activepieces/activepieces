import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const WEINC_BASE_URL = 'https://my.we.inc/api/v1';

export async function weincRequest<T>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: QueryParams;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${WEINC_BASE_URL}${path}`,
    body,
    queryParams,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
  });
  return response.body;
}

/** Drops keys whose value is undefined, null or an empty string. */
export function compact(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
}

export type WeincProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  org_client_id: string | null;
  published_url: string | null;
  custom_domain: string | null;
  last_published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WeincClient = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  status: string;
  plan_id: string | null;
  payment_status: string | null;
  created_at: string;
};
