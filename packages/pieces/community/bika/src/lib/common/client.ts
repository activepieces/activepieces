import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { BikaFieldType } from './constants';

function emptyValueFilter(
  accessor: (key: string) => any
): (key: string) => boolean {
  return (key: string) => {
    const val = accessor(key);
    return (
      val !== null &&
      val !== undefined &&
      (typeof val != 'string' || val.length > 0)
    );
  };
}

export function prepareQuery(request?: Record<string, any>): QueryParams {
  const params: QueryParams = {};
  if (!request) return params;
  Object.keys(request)
    .filter(emptyValueFilter((k) => request[k]))
    .forEach((k: string) => {
      params[k] = (request as Record<string, any>)[k].toString();
    });
  return params;
}


export class BikaClient {
  constructor( private token: string, private bikaUrl = "https://bika.ai") {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    query?: QueryParams,
    body: any | undefined = undefined
  ): Promise<T> {
    const baseUrl = this.bikaUrl.replace(/\/$/, '');

    const res = await httpClient.sendRequest<T>({
      method: method,
      url: `${baseUrl}/api/openapi/bika` + resourceUri,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.token,
      },
      queryParams: query,
      body: body,
    });

    return res.body;
  }

  async listSpaces() {
    return await this.makeRequest<{
      data: {
          id: string;
          name: string;
        }[];
    }>(HttpMethod.GET, '/v1/spaces');
  }
  async listDatabases(space_id: string) {
    return await this.makeRequest<{
      data: {
          id: string;
          name: string;
      }[];
    }>(HttpMethod.GET, `/v1/spaces/${space_id}/nodes`);
  }

  async getDatabaseFields(space_id: string, database_id: string) {
    return await this.makeRequest<{
      data: {
          id: string;
          name: string;
          type: BikaFieldType;
          desc: string;
          property?: {
            format?: string;
            defaultValue?: string;
            options?: {
              name: string;
              id?: string;
            }[];
        };
      }[];
    }>(HttpMethod.GET, `/v1/spaces/${space_id}/resources/databases/${database_id}/fields`);
  }

  async createRecord(space_id: string, database_id: string, request: object) {
    return await this.makeRequest(
      HttpMethod.POST,
      `/v2/spaces/${space_id}/resources/databases/${database_id}/records`,
      undefined,
      request
    );
  }
    async deleteRecord(space_id: string, database_id: string, record_id: string) {
    return await this.makeRequest(
      HttpMethod.DELETE,
      `/v2/spaces/${space_id}/resources/databases/${database_id}/records/${record_id}`
    );
  }
  async updateRecord(space_id: string, database_id: string, record_id: string, request: object) {
    return await this.makeRequest(
      HttpMethod.PUT,
      `/v2/spaces/${space_id}/resources/databases/${database_id}/records/${record_id}`,
      undefined,
      request
    );
  }

    async findRecord(space_id: string, database_id: string, record_id: string, query?: QueryParams) {
    return await this.makeRequest<{
      data: {
        total: number;
        records: {
          recordId: string;
          createdAt: number;
          updatedAt: number;
          fields: Record<string, unknown>;
        }[];
      };
    }>(HttpMethod.GET, `/v2/spaces/${space_id}/resources/databases/${database_id}/records/${record_id}`, query);
  }


  async listRecords(space_id: string, database_id: string, query?: QueryParams) {
    return await this.makeRequest<{
      data: {
        total: number;
        records: {
          recordId: string;
          createdAt: number;
          updatedAt: number;
          fields: Record<string, unknown>;
        }[];
      };
    }>(HttpMethod.GET, `/v2/spaces/${space_id}/resources/databases/${database_id}/records`, query);
  }
}
