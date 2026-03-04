import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';


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


const TEABLE_CLOUD_URL = 'https://app.teable.ai';

export class TeableClient {
  private readonly apiBase: string;

  constructor(
    private token: string,
    teableUrl: string = TEABLE_CLOUD_URL
  ) {
    this.apiBase = teableUrl.replace(/\/$/, '') + '/api';
  }

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    query?: QueryParams,
    body: any | undefined = undefined
  ): Promise<T> {
    const res = await httpClient.sendRequest<T>({
      method,
      url: this.apiBase + resourceUri,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.token,
      },
      queryParams: query,
      body: body,
    });

    return res.body;
  }

  /**
   * GET /api/base/access/all
   * Returns all bases the token has access to.
   * @see https://help.teable.ai/en/api-reference/base/get-baseaccessall
   */
  async listBases() {
    return await this.makeRequest<
      {
        id: string;
        name: string;
        spaceId: string;
        icon: string | null;
        role: string;
      }[]
    >(HttpMethod.GET, '/base/access/all');
  }

  /**
   * GET /api/base/{baseId}/table
   * Returns all tables in the given base.
   * @see https://help.teable.ai/en/api-reference/table/list-tables
   */
  async listTables(baseId: string) {
    return await this.makeRequest<
      {
        id: string;
        name: string;
        dbTableName: string;
        description?: string;
        icon?: string;
        order: number;
        defaultViewId?: string;
      }[]
    >(HttpMethod.GET, `/base/${baseId}/table`);
  }

  /**
   * GET /api/table/{tableId}/field
   * Returns all fields in the given table.
   * @see https://help.teable.ai/en/api-reference/field/list-fields
   */
  async listFields(tableId: string) {
    return await this.makeRequest<
      {
        id: string;
        name: string;
        type: string;
        isComputed?: boolean;
        isPrimary?: boolean;
        options?: {
          choices?: { id: string; name: string; color?: string }[];
          [key: string]: unknown;
        };
      }[]
    >(HttpMethod.GET, `/table/${tableId}/field`);
  }

  /**
   * GET /api/table/{tableId}/record/{recordId}
   * Retrieves a single record by its ID.
   * @see https://help.teable.ai/en/api-reference/record/get-record
   */
  async getRecord(
    tableId: string,
    recordId: string,
    query?: QueryParams
  ) {
    return await this.makeRequest<{
      id: string;
      fields: Record<string, unknown>;
      name: string;
      autoNumber: number;
      createdTime: string;
      lastModifiedTime: string;
      createdBy: string;
      lastModifiedBy: string;
      permissions: Record<string, unknown>;
    }>(HttpMethod.GET, `/table/${tableId}/record/${recordId}`, query);
  }

  /**
   * GET /api/table/{tableId}/record
   * Retrieves a list of records with support for filtering, sorting, and pagination.
   * @see https://help.teable.ai/en/api-reference/record/list-records
   */
  async listRecords(
    tableId: string,
    query?: QueryParams
  ) {
    console.log("YOYOYO",tableId)
    return await this.makeRequest<{
      records: {
        id: string;
        fields: Record<string, unknown>;
      }[];
    }>(HttpMethod.GET, `/table/${tableId}/record`);
  }

  /**
   * POST /api/table/{tableId}/record
   * Creates one or more records.
   */
  async createRecord(tableId: string, request: object) {
    return await this.makeRequest(
      HttpMethod.POST,
      `/table/${tableId}/record`,
      undefined,
      request
    );
  }

  /**
   * DELETE /api/table/{tableId}/record/{recordId}
   * Deletes a single record.
   */
  async deleteRecord(tableId: string, recordId: string) {
    return await this.makeRequest(
      HttpMethod.DELETE,
      `/table/${tableId}/record/${recordId}`
    );
  }

  /**
   * PATCH /api/table/{tableId}/record/{recordId}
   * Updates a single record.
   */
  async updateRecord(tableId: string, recordId: string, request: object) {
    return await this.makeRequest(
      HttpMethod.PATCH,
      `/table/${tableId}/record/${recordId}`,
      undefined,
      request
    );
  }
}
