import {
  httpClient,
  HttpMethod,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { createOAuthHeader } from './oauth';

const PAGE_SIZE = 1000;

interface NetSuiteAuth {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
}

interface MakeRequestParams {
  method: HttpMethod;
  url: string;
  queryParams?: QueryParams;
  body?: unknown;
}

interface CreateRecordParams {
  recordType: string;
  body: unknown;
}

interface PaginatedResponse<T> {
  items?: T[];
  hasMore?: boolean;
}

export class NetSuiteClient {
  private auth: NetSuiteAuth;

  constructor(auth: NetSuiteAuth) {
    this.auth = auth;
  }

  get baseUrl(): string {
    return `https://${this.auth.accountId}.suitetalk.api.netsuite.com`;
  }

  async makeRequest<T>(params: MakeRequestParams): Promise<T> {
    const response = await this.send<T>(params);
    return response.body;
  }

  // Record creates return 204 No Content with the new record's URL in the
  // Location header; parse the trailing id from it rather than the empty body.
  async createRecord({ recordType, body }: CreateRecordParams): Promise<{
    id: string | null;
    recordType: string;
    location: string | null;
  }> {
    const response = await this.send({
      method: HttpMethod.POST,
      url: `${this.baseUrl}/services/rest/record/v1/${recordType}`,
      body,
    });

    const header = response.headers?.['location'];
    const location = Array.isArray(header) ? header[0] : header ?? null;
    const id = location ? location.split('/').pop() ?? null : null;

    return { id, recordType, location };
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

  private async send<T>({
    method,
    url,
    queryParams,
    body,
  }: MakeRequestParams): Promise<HttpResponse<T>> {
    const authHeader = createOAuthHeader(
      this.auth.accountId,
      this.auth.consumerKey,
      this.auth.consumerSecret,
      this.auth.tokenId,
      this.auth.tokenSecret,
      url,
      method,
      queryParams
    );

    return httpClient.sendRequest<T>({
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
  }
}
