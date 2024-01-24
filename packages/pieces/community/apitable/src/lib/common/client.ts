import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { AITableFieldType } from './constants';

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

export class AITableClient {
  constructor(private apiTableUrl: string, private token: string) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    query?: QueryParams,
    body: any | undefined = undefined
  ): Promise<T> {
    const baseUrl = this.apiTableUrl.replace(/\/$/, '');
    const res = await httpClient.sendRequest<T>({
      method: method,
      url: `${baseUrl}/fusion` + resourceUri,
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
        spaces: {
          id: string;
          name: string;
        }[];
      };
    }>(HttpMethod.GET, '/v1/spaces');
  }
  async listDatasheets(space_id: string) {
    return await this.makeRequest<{
      data: {
        nodes: {
          id: string;
          name: string;
        }[];
      };
    }>(HttpMethod.GET, `/v2/spaces/${space_id}/nodes`, { type: 'Datasheet' });
  }

  async getDatasheetFields(datasheet_id: string) {
    return await this.makeRequest<{
      data: {
        fields: {
          id: string;
          name: string;
          type: AITableFieldType;
          desc: string;
          property?: {
            format?: string;
            defaultValue?: string;
            options?: {
              name: string;
            }[];
          };
        }[];
      };
    }>(HttpMethod.GET, `/v1/datasheets/${datasheet_id}/fields`);
  }

  async createRecord(datasheet_id: string, request: object) {
    return await this.makeRequest(
      HttpMethod.POST,
      `/v1/datasheets/${datasheet_id}/records`,
      undefined,
      request
    );
  }
  async updateRecord(datasheet_id: string, request: object) {
    return await this.makeRequest(
      HttpMethod.PATCH,
      `/v1/datasheets/${datasheet_id}/records`,
      undefined,
      request
    );
  }

  async listRecords(datasheet_id: string, query?: QueryParams) {
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
    }>(HttpMethod.GET, `/v1/datasheets/${datasheet_id}/records`, query);
  }
}
