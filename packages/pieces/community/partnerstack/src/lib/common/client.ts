import {
  AuthenticationType,
  HttpMessageBody,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { PARTNERSTACK_BASE_URL, PartnerStackAuth } from '../auth';

export type PartnerStackRequestParams = {
  auth: PartnerStackAuth;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export type PartnerStackListResponse<T> = {
  data: {
    items: T[];
    has_more?: boolean;
    total?: number | null;
  };
  message?: string;
  status?: number;
};

export type PartnerStackPartnership = {
  key: string;
  email?: string;
  name?: string;
  company_name?: string;
  approved_status?: string;
  [key: string]: unknown;
};

export type PartnerStackReward = {
  key?: string;
  amount?: number;
  currency?: string;
  description?: string;
  [key: string]: unknown;
};

export async function partnerstackApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: PartnerStackRequestParams): Promise<T> {
  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      queryParams[key] = String(value);
    }
  }

  const request: HttpRequest = {
    method,
    url: `${PARTNERSTACK_BASE_URL}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.publicKey,
      password: auth.privateKey,
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
