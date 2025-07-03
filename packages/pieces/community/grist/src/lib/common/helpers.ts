import { DynamicPropsValue } from '@activepieces/pieces-framework';
import {
  GristAPIClientOptions,
  GristCreateRecordsRequest,
  GristCreateRecordsResponse,
  GristCreateWebhookRequest,
  GristCreateWebhookResponse,
  GristListRecordsResponse,
  GristOrgResponse,
  GristTableColumnsResponse,
  GristTableResponse,
  GristUpdateRecordsRequest,
  GristWorkspaceResponse,
} from './types';
import {
  AuthenticationType,
  httpClient,
  HttpHeaders,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';

type Query = Record<string, string | number | string[] | undefined>;

export class GristAPIClient {
  #domaiUrl: string;
  #apiKey: string;
  constructor(options: GristAPIClientOptions) {
    this.#domaiUrl = options.domainUrl;
    this.#apiKey = options.apiKey;
  }

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    headers?: HttpHeaders,
    query?: Query,
    body: any | undefined = undefined
  ): Promise<T> {
    const baseUrl = this.#domaiUrl.replace(/\/$/, '');
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
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.#apiKey,
      },
      headers,
      queryParams: params,
      body: body,
    };
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  }

  async listOrgs() {
    return await this.makeRequest<GristOrgResponse[]>(
      HttpMethod.GET,
      `/orgs`
    );
  }

  async listWorkspaces(orgId: string) {
    return await this.makeRequest<GristWorkspaceResponse[]>(
      HttpMethod.GET,
      `/orgs/${orgId}/workspaces`
    );
  }

  async getWorkspace(workspaceId: number) {
    return await this.makeRequest<GristWorkspaceResponse>(
      HttpMethod.GET,
      `/workspaces/${workspaceId}`
    );
  }

  async listDocumentTables(docId: string) {
    return await this.makeRequest<{ tables: GristTableResponse[] }>(
      HttpMethod.GET,
      `/docs/${docId}/tables`
    );
  }

  async listTableColumns(docId: string, tableId: string) {
    return await this.makeRequest<{ columns: GristTableColumnsResponse[] }>(
      HttpMethod.GET,
      `/docs/${docId}/tables/${tableId}/columns`
    );
  }

  async addRecordsToTable(
    docId: string,
    tableId: string,
    request: GristCreateRecordsRequest
  ) {
    return await this.makeRequest<GristCreateRecordsResponse>(
      HttpMethod.POST,
      `/docs/${docId}/tables/${tableId}/records`,
      undefined,
      {},
      request
    );
  }

  async updateRcordsInTable(
    docId: string,
    tableId: string,
    request: GristUpdateRecordsRequest
  ) {
    return await this.makeRequest<GristCreateRecordsResponse>(
      HttpMethod.PATCH,
      `/docs/${docId}/tables/${tableId}/records`,
      undefined,
      {},
      request
    );
  }

  async listRecordsFromTable(docId: string, tableId: string, query: Query) {
    return await this.makeRequest<GristListRecordsResponse>(
      HttpMethod.GET,
      `/docs/${docId}/tables/${tableId}/records`,
      undefined,
      query
    );
  }

  async listDocumentAttachments(docId: string, query: Query) {
    return await this.makeRequest<GristListRecordsResponse>(
      HttpMethod.GET,
      `/docs/${docId}/attachments`,
      {},
      query
    );
  }

  async getDocumentAttachmentMetadata(docId: string, attachmentId: number) {
    return await this.makeRequest<GristListRecordsResponse>(
      HttpMethod.GET,
      `/docs/${docId}/attachments/${attachmentId}`
    );
  }

  async createDocumentWebhook(
    docId: string,
    request: GristCreateWebhookRequest
  ) {
    return await this.makeRequest<GristCreateWebhookResponse>(
      HttpMethod.POST,
      `/docs/${docId}/webhooks`,
      undefined,
      {},
      request
    );
  }

  async deleteDocumentWebhook(docId: string, webhookId: number) {
    return await this.makeRequest(
      HttpMethod.DELETE,
      `/docs/${docId}/webhooks/${webhookId}`
    );
  }
}

export function transformTableColumnValues({
  tableColumnSchema,
  tableColumnValues,
}: {
  tableColumnSchema: { columns: GristTableColumnsResponse[] };
  tableColumnValues: DynamicPropsValue;
}): DynamicPropsValue {
  const fields: DynamicPropsValue = {};

  for (const column of tableColumnSchema.columns) {
    const columnId = column.id;
    const columnType = column.fields.type;
    const columnValue = tableColumnValues[columnId];

    if (columnValue !== undefined && columnValue !== '') {
      if (columnType === 'Attachments') {
        const attachmentsArray = Array.isArray(columnValue)
          ? columnValue
          : JSON.parse(columnValue);
        if (Array.isArray(attachmentsArray) && attachmentsArray.length > 0) {
          fields[columnId] = ['L', ...attachmentsArray.map(Number)];
        }
      } else if (columnType === 'ChoiceList') {
        if (Array.isArray(columnValue) && columnValue.length > 0) {
          fields[columnId] = ['L', ...columnValue];
        }
      } else if (columnType === 'Int' || columnType === 'Numeric') {
        fields[columnId] = Number(columnValue);
      } else if (columnType.startsWith('RefList')) {
        const refListArray = Array.isArray(columnValue)
          ? columnValue
          : JSON.parse(columnValue);
        if (Array.isArray(refListArray) && refListArray.length > 0) {
          fields[columnId] = ['L', ...refListArray.map(Number)];
        }
      } else if (columnType.startsWith('Ref')) {
        fields[columnId] = Number(columnValue);
      } else {
        fields[columnId] = columnValue;
      }
    }
  }

  return fields;
}
