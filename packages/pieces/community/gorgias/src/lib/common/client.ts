import {
  AuthenticationType,
  HttpMessageBody,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { GorgiasAuth, getGorgiasBaseUrl } from '../auth';

export type GorgiasPaginationMeta = {
  prev_cursor?: string | null;
  next_cursor?: string | null;
};

export type GorgiasListResponse<T> = {
  data: T[];
  object: string;
  uri: string;
  meta: GorgiasPaginationMeta;
};

export type GorgiasCustomer = {
  id: number;
  email?: string;
  name?: string;
  channels?: Array<{ address?: string }>;
  [key: string]: unknown;
};

export type GorgiasRequestParams = {
  auth: GorgiasAuth;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export async function gorgiasApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: GorgiasRequestParams): Promise<T> {
  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `${getGorgiasBaseUrl(auth.domain)}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.email,
      password: auth.api_key,
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    queryParams,
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export async function findCustomerByEmail(
  auth: GorgiasAuth,
  email: string,
): Promise<GorgiasCustomer | null> {
  const lowerEmail = email.trim().toLowerCase();

  const response = await gorgiasApiCall<GorgiasListResponse<GorgiasCustomer>>({
    auth,
    method: HttpMethod.GET,
    resourceUri: '/customers',
    query: {
      email: lowerEmail,
      limit: 100,
    },
  });

  return response.data.find((customer) => {
    const primaryEmail = typeof customer.email === 'string' ? customer.email.toLowerCase() : undefined;
    const channelMatch = Array.isArray(customer.channels)
      ? customer.channels.some((channel) => channel.address?.toLowerCase() === lowerEmail)
      : false;
    return primaryEmail === lowerEmail || channelMatch;
  }) ?? null;
}
