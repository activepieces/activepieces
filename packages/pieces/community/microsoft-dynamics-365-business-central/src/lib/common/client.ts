import { businessCentralAuth } from '../../';
import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
  HttpRequest,
  AuthenticationType,
  HttpHeaders,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';

interface ListAPIResponse<T> {
  '@odata.context': string;
  value: Array<T>;
}

interface CompanyResponse {
  id: string;
  name: string;
}

export type filterParams = Record<
  string,
  string | number | string[] | undefined
>;

export class BusinessCentralAPIClient {
  constructor(private environment: string, private accessToken: string) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    query?: filterParams,
    body: any | undefined = undefined
  ): Promise<T> {
    const baseUrl = `https://api.businesscentral.dynamics.com/v2.0/${this.environment}/api/v2.0`;
    const params: QueryParams = {};
    const headers: HttpHeaders = {};

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== null && value !== undefined) {
          params[key] = String(value);
        }
      }
    }

    if (method === HttpMethod.PATCH || method === HttpMethod.DELETE) {
      headers['If-Match'] = '*';
    }

    const request: HttpRequest = {
      method: method,
      url: baseUrl + resourceUri,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
      headers,
      queryParams: params,
      body: body,
    };

    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  }

  async listCompanies(): Promise<ListAPIResponse<CompanyResponse>> {
    return await this.makeRequest(HttpMethod.GET, '/companies');
  }

  async createRecord(endpoint: string, request: Record<string, any>) {
    return await this.makeRequest(
      HttpMethod.POST,
      endpoint,
      undefined,
      request
    );
  }

  async updateRecord(endpoint: string, request: Record<string, any>) {
    return await this.makeRequest(
      HttpMethod.PATCH,
      endpoint,
      undefined,
      request
    );
  }

  async getRecord(endpoint: string) {
    return await this.makeRequest(HttpMethod.GET, endpoint);
  }

  async deleteRecord(endpoint: string) {
    return await this.makeRequest(HttpMethod.DELETE, endpoint);
  }

  async filterRecords(
    companyId: string,
    recordType: string,
    params: filterParams
  ): Promise<ListAPIResponse<Record<string, unknown>>> {
    return await this.makeRequest(
      HttpMethod.GET,
      `/companies(${companyId})/${recordType}`,
      params
    );
  }
}

export function makeClient(
  auth: PiecePropValueSchema<typeof businessCentralAuth>
) {
  const client = new BusinessCentralAPIClient(
    auth.props?.['environment'],
    auth.access_token
  );
  return client;
}
