import {
  AuthenticationType,
  HttpMessageBody,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { REWARDFUL_BASE_URL, RewardfulAuth } from '../auth';

export type RewardfulListResponse<T> = {
  pagination?: {
    previous_page?: number | null;
    current_page?: number;
    next_page?: number | null;
    count?: number;
    limit?: number;
    total_pages?: number;
    total_count?: number;
  };
  data: T[];
};

export type RewardfulCampaign = {
  id: string;
  name?: string;
  state?: string;
  slug?: string;
  [key: string]: unknown;
};

export type RewardfulAffiliate = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
};

export type RewardfulReferral = {
  id: string;
  affiliate_id?: string;
  campaign_id?: string;
  email?: string;
  [key: string]: unknown;
};

export type RewardfulRequestParams = {
  auth: RewardfulAuth;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | boolean | undefined | string[]>;
  body?: unknown;
};

export async function rewardfulApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: RewardfulRequestParams): Promise<T> {
  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          queryParams[`${key}[${index}]`] = String(item);
        });
        continue;
      }
      queryParams[key] = String(value);
    }
  }

  const request: HttpRequest = {
    method,
    url: `${REWARDFUL_BASE_URL}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.apiSecret,
      password: '',
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
