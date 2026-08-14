import {
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { createOAuthHeader } from './oauth';
import { isM2MAuth, NetSuiteAuthValue } from '../auth';

const PAGE_SIZE = 1000;

interface MakeRequestParams {
  method: HttpMethod;
  url: string;
  queryParams?: QueryParams;
  body?: unknown;
}

interface PaginatedResponse<T> {
  items?: T[];
  hasMore?: boolean;
}

export function buildNetSuiteAuthorizationHeader({
  auth,
  url,
  method,
  queryParams,
}: {
  auth: NetSuiteAuthValue;
  url: string;
  method: string;
  queryParams?: Record<string, string | number | boolean>;
}): string {
  if (isM2MAuth(auth)) {
    if (!auth.access_token) {
      throw new Error(
        "NetSuite OAuth 2.0 Client Credentials (M2M) access token is missing. Reconnect the connection so it can be refreshed."
      );
    }
    return `Bearer ${auth.access_token}`;
  }

  return createOAuthHeader(
    auth.props.accountId,
    auth.props.consumerKey,
    auth.props.consumerSecret,
    auth.props.tokenId,
    auth.props.tokenSecret,
    url,
    method,
    queryParams
  );
}

export class NetSuiteClient {
  private auth: NetSuiteAuthValue;

  constructor(auth: NetSuiteAuthValue) {
    this.auth = auth;
  }

  get baseUrl(): string {
    return `https://${this.auth.props.accountId}.suitetalk.api.netsuite.com`;
  }

  async makeRequest<T>({
    method,
    url,
    queryParams,
    body,
  }: MakeRequestParams): Promise<T> {
    const authHeader = buildNetSuiteAuthorizationHeader({
      auth: this.auth,
      url,
      method,
      queryParams,
    });

    const response = await httpClient.sendRequest({
      method,
      url,
      headers: {
        Authorization: authHeader,
        prefer: 'transient',
        Cookie: 'NS_ROUTING_VERSION=LAGGING',
      },
      queryParams,
      body,
    });

    return response.body;
  }

  // paginate results: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156414087576.html
  async makePaginatedRequest<T>({
    method,
    url,
    body,
  }: Omit<MakeRequestParams, 'queryParams'>): Promise<T[]> {
    const results: T[] = [];
    let pageOffset = 0;
    let hasMore = true;

    while (hasMore) {
      const queryParams = {
        limit: String(PAGE_SIZE),
        offset: String(pageOffset),
      };

      const response = await this.makeRequest<PaginatedResponse<T>>({
        method,
        url,
        queryParams,
        body,
      });

      results.push(...(response.items || []));
      hasMore = response.hasMore ?? false;
      pageOffset += PAGE_SIZE;
    }

    return results;
  }
}
