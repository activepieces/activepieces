import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  BaseResponse,
  DataOperationResponse,
  DataOperationV3Response,
  GetTableResponse,
  GetTableV3Response,
  ListAPIResponse,
  ListAPIV3Response,
  ListRecordsParams,
  TableResponse,
  WorkspaceResponse,
} from './types';

export class NocoDBClient {
  constructor(private hostUrl: string, private apiToken: string) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    query?: Record<string, string | number | string[] | undefined>,
    body: Record<string, unknown> | undefined = undefined
  ): Promise<T> {
    const baseUrl = this.hostUrl.replace(/\/$/, '');
    const params: QueryParams = {};
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== null && value !== undefined) {
          params[key] = String(value);
        }
      }
    }
    const request: HttpRequest = {
      method: method,
      url: baseUrl + '/api' + resourceUri,
      headers: {
        'xc-token': this.apiToken,
      },
      queryParams: params,
      body: body,
    };
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  }

  async listWorkspaces(): Promise<ListAPIResponse<WorkspaceResponse>> {
    return await this.makeRequest<ListAPIResponse<WorkspaceResponse>>(
      HttpMethod.GET,
      '/v1/workspaces/'
    );
  }

  async listBases(
    workspaceId?: string,
    version = 3
  ): Promise<ListAPIResponse<BaseResponse>> {
    if (workspaceId && workspaceId !== 'none') {
      // Cloud version
      const endpoint =
        version === 4
          ? `/v3/meta/workspaces/${workspaceId}/bases/`
          : `/v1/workspaces/${workspaceId}/bases/`;
      return await this.makeRequest<ListAPIResponse<BaseResponse>>(
        HttpMethod.GET,
        endpoint
      );
    } else {
      // Self-hosted version
      const endpoint =
        version === 4
          ? '/v3/meta/workspaces/nc/bases/'
          : version === 3
          ? '/v2/meta/bases/'
          : '/v1/db/meta/projects/';

      return await this.makeRequest<ListAPIResponse<BaseResponse>>(
        HttpMethod.GET,
        endpoint
      );
    }
  }

  async listTables(
    baseId: string,
    version = 3
  ): Promise<ListAPIResponse<TableResponse>> {
    const endpoint =
      version === 4
        ? `/v3/meta/bases/${baseId}/tables`
        : version === 3
        ? `/v2/meta/bases/${baseId}/tables`
        : `/v1/db/meta/projects/${baseId}/tables`;
    return await this.makeRequest<ListAPIResponse<TableResponse>>(
      HttpMethod.GET,
      endpoint
    );
  }

  async getTable(
    _baseId: string,
    tableId: string,
    version = 3
  ): Promise<GetTableResponse> {
    const endpoint =
      version === 3
        ? `/v2/meta/tables/${tableId}/`
        : `/v1/db/meta/tables/${tableId}/`;
    return await this.makeRequest<GetTableResponse>(HttpMethod.GET, endpoint);
  }

  async getTableV3(
    baseId: string,
    tableId: string,
    _version = 4
  ): Promise<GetTableV3Response> {
    const endpoint = `/v3/meta/bases/${baseId}/tables/${tableId}`;
    return await this.makeRequest<GetTableV3Response>(HttpMethod.GET, endpoint);
  }

  async createRecord(
    baseId: string,
    tableId: string,
    recordInput: Record<string, unknown>,
    version = 3
  ) {
    const endpoint =
      version === 4
        ? `/v3/data/${baseId}/${tableId}/records`
        : version === 3
        ? `/v2/tables/${tableId}/records`
        : `/v1/db/data/noco/${tableId}`;
    const response = await this.makeRequest<DataOperationResponse>(
      HttpMethod.POST,
      endpoint,
      undefined,
      version === 4 ? { fields: recordInput } : recordInput
    );
    if (version === 4) {
      return (response as DataOperationV3Response).records?.[0] ?? response;
    } else {
      return response;
    }
  }

  async getRecord(
    baseId: string,
    tableId: string,
    recordId: number,
    version = 3
  ) {
    const endpoint =
      version === 4
        ? `/v3/data/${baseId}/${tableId}/records/${recordId}`
        : version === 3
        ? `/v2/tables/${tableId}/records/${recordId}`
        : `/v1/db/data/noco/${tableId}/${recordId}`;
    return await this.makeRequest(HttpMethod.GET, endpoint);
  }

  async updateRecord(
    baseId: string,
    tableId: string,
    recordInput: Record<string, unknown>,
    version = 3
  ) {
    const endpoint =
      version === 4
        ? `/v3/data/${baseId}/${tableId}/records`
        : version === 3
        ? `/v2/tables/${tableId}/records/`
        : `/v1/db/data/noco/${tableId}`;

    const response = await this.makeRequest<DataOperationResponse>(
      HttpMethod.PATCH,
      endpoint,
      undefined,
      recordInput
    );

    if (version === 4) {
      return (response as DataOperationV3Response).records?.[0] ?? response;
    } else {
      return response;
    }
  }

  async deleteRecord(
    baseId: string,
    tableId: string,
    recordId: number,
    version = 3
  ) {
    const endpoint =
      version === 4
        ? `/v3/data/${baseId}/${tableId}/records/`
        : version === 3
        ? `/v2/tables/${tableId}/records/`
        : `/v1/db/data/noco/${tableId}/${recordId}`;
    const body =
      version === 4
        ? { id: recordId }
        : version === 3
        ? { Id: recordId }
        : undefined;
    const response = await this.makeRequest<DataOperationResponse>(HttpMethod.DELETE, endpoint, undefined, body);

    if (version === 4) {
      return (response as DataOperationV3Response).records?.[0] ?? response;
    } else {
      return response;
    }
    
  }

  async listRecords(
    baseId: string,
    tableId: string,
    params: ListRecordsParams,
    version = 3
  ): Promise<
    | ListAPIResponse<Record<string, unknown>>
    | ListAPIV3Response<Record<string, unknown>>
  > {
    const endpoint =
      version === 4
        ? `/v3/data/${baseId}/${tableId}/records`
        : version === 3
        ? `/v2/tables/${tableId}/records/`
        : `/v1/db/data/noco/${tableId}`;

    if (version === 4 && params.sort && typeof params.sort === 'string') {
      const sortItems = params.sort.split(',');
      // format to v3
      params.sort = JSON.stringify(
        sortItems.map((item) => {
          if (item.startsWith('-')) {
            return {
              field: item.substring(1),
              direction: 'desc',
            };
          } else {
            return {
              field: item,
              direction: 'asc',
            };
          }
        })
      );
    }

    const makeRequest = async <T>() => {
      return await this.makeRequest<T>(HttpMethod.GET, endpoint, params);
    };
    if (version === 4) {
      return makeRequest<ListAPIV3Response<Record<string, unknown>>>();
    } else {
      return makeRequest<ListAPIResponse<Record<string, unknown>>>();
    }
  }
}
