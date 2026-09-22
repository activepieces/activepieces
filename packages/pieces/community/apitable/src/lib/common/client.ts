import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { AITableFieldType } from './constants';
import FormData from 'form-data';

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

type NodeSummary = {
  id: string;
  name: string;
  type: string;
  icon: string;
  isFav: boolean;
  permission: number;
  parentId?: string;
};

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
    body: any | undefined = undefined,
    headers?: Record<string, string>
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
      headers: headers,
    });
    return res.body;
  }

  async listSpaces() {
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
      data: {
        spaces: {
          id: string;
          name: string;
          isAdmin: boolean;
        }[];
      };
    }>(HttpMethod.GET, '/v1/spaces');
  }
  async listDatasheets(space_id: string) {
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
      data: {
        nodes: NodeSummary[];
      };
    }>(HttpMethod.GET, `/v2/spaces/${space_id}/nodes`, { type: 'Datasheet' });
  }

  async searchNodes(
    space_id: string,
    query?: { type?: string; query?: string }
  ) {
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
      data: {
        nodes: NodeSummary[];
      };
    }>(HttpMethod.GET, `/v2/spaces/${space_id}/nodes`, prepareQuery(query));
  }

  async getNodeDetails(space_id: string, node_id: string) {
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
      data: NodeSummary & {
        children?: NodeSummary[];
      };
    }>(HttpMethod.GET, `/v1/spaces/${space_id}/nodes/${node_id}`);
  }

  async getDatasheetFields(datasheet_id: string) {
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
      data: {
        fields: {
          id: string;
          name: string;
          type: AITableFieldType;
          editable: boolean;
          isPrimary?: boolean;
          property?: {
            defaultValue?: string;
            options?: {
              id: string;
              name: string;
              color?: { name: string; value: string };
            }[];
          };
        }[];
      };
    }>(HttpMethod.GET, `/v1/datasheets/${datasheet_id}/fields`);
  }

  async createRecord(datasheet_id: string, request: object) {
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
      data: {
        records: {
          recordId: string;
          fields: Record<string, unknown>;
        }[];
      };
    }>(HttpMethod.POST, `/v1/datasheets/${datasheet_id}/records`, undefined, request);
  }
  async updateRecord(datasheet_id: string, request: object) {
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
      data: {
        records: {
          recordId: string;
          createdAt: number;
          updatedAt: number;
          fields: Record<string, unknown>;
        }[];
      };
    }>(HttpMethod.PATCH, `/v1/datasheets/${datasheet_id}/records`, undefined, request);
  }

  async listRecords(datasheet_id: string, query?: QueryParams) {
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
      data: {
        total: number;
        pageNum: number;
        pageSize: number;
        records: {
          recordId: string;
          createdAt: number;
          updatedAt: number;
          fields: Record<string, unknown>;
        }[];
      };
    }>(HttpMethod.GET, `/v1/datasheets/${datasheet_id}/records`, query);
  }

  async uploadAttachment(datasheet_id: string, filename: string, file: Buffer) {
    const formData = new FormData();
    formData.append('file', file, { filename });
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
      data: {
        token: string;
        mimeType: string;
        size: number;
        width?: number;
        height?: number;
        name: string;
        url: string;
      };
    }>(
      HttpMethod.POST,
      `/v1/datasheets/${datasheet_id}/attachments`,
      undefined,
      formData,
      formData.getHeaders()
    );
  }

  async listViews(datasheet_id: string) {
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
      data: {
        views: {
          id: string;
          name: string;
          type: string;
        }[];
      };
    }>(HttpMethod.GET, `/v1/datasheets/${datasheet_id}/views`);
  }

  async deleteRecords(datasheet_id: string, recordIds: string[]) {
    return await this.makeRequest<{
      success: boolean;
      code: number;
      message: string;
    }>(HttpMethod.DELETE, `/v1/datasheets/${datasheet_id}/records`, {
      recordIds: recordIds.join(','),
    });
  }
}
