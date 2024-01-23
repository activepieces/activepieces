import {
  Authentication,
  AuthenticationType,
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import {
  Folder,
  FolderCreateRequest,
  FolderCreateResponse,
  FolderGetRequest,
  FolderHierarchy,
  FolderListRequest,
} from './models/folder';
import { ActionResponse, prepareQueryRequest } from './models/common';
import {
  Paste,
  PasteCreateRequest,
  PasteCreateResponse,
  PasteEditRequest,
  PasteListRequest,
  PasteShareRequest,
} from './models/paste';

function ensureSuccessfulResponse<T extends ActionResponse>(res: T): T {
  if (!res.success) {
    throw 'Request failed';
  }
  return res;
}

export class PastefyClient {
  constructor(
    private apiKey?: string,
    private instanceUrl = 'https://pastefy.app'
  ) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    url: string,
    query?: QueryParams,
    body?: object
  ): Promise<T> {
    const authentication: Authentication | undefined = this.apiKey
      ? {
          type: AuthenticationType.BEARER_TOKEN,
          token: this.apiKey,
        }
      : undefined;
    const res = await httpClient.sendRequest<T>({
      method,
      url: this.instanceUrl + '/api/v2' + url,
      queryParams: query,
      body,
      authentication,
    });
    return res.body;
  }

  async createFolder(
    request: FolderCreateRequest
  ): Promise<FolderCreateResponse> {
    return ensureSuccessfulResponse<FolderCreateResponse>(
      await this.makeRequest(HttpMethod.POST, '/folder', undefined, request)
    );
  }

  async listFolders(request: FolderListRequest): Promise<Folder[]> {
    return await this.makeRequest(
      HttpMethod.GET,
      '/folder',
      prepareQueryRequest(request)
    );
  }

  async getFolder(id: string, request?: FolderGetRequest): Promise<Folder> {
    return await this.makeRequest(
      HttpMethod.GET,
      '/folder/' + id,
      prepareQueryRequest(request)
    );
  }

  async getFolderHierarchy(parentId?: string): Promise<FolderHierarchy[]> {
    const folders = await this.listFolders({
      page_size: 99999,
      filter: {
        parent: parentId || 'null',
      },
    });
    const hierarchies: FolderHierarchy[] = [];
    for (const folder of folders) {
      hierarchies.push({
        id: folder.id,
        name: folder.name,
        children: await this.getFolderHierarchy(folder.id),
      });
    }
    return hierarchies;
  }

  async deleteFolder(id: string): Promise<ActionResponse> {
    return ensureSuccessfulResponse(
      await this.makeRequest(HttpMethod.DELETE, '/folder/' + id)
    );
  }

  async createPaste(request: PasteCreateRequest): Promise<PasteCreateResponse> {
    return ensureSuccessfulResponse<PasteCreateResponse>(
      await this.makeRequest(HttpMethod.POST, '/paste', undefined, request)
    );
  }

  async listPastes(request: PasteListRequest): Promise<Paste[]> {
    return await this.makeRequest(
      HttpMethod.GET,
      '/paste',
      prepareQueryRequest(request)
    );
  }

  async getPaste(id: string): Promise<Paste> {
    return await this.makeRequest(HttpMethod.GET, '/paste/' + id);
  }

  async editPaste(
    id: string,
    request: PasteEditRequest
  ): Promise<ActionResponse> {
    return ensureSuccessfulResponse(
      await this.makeRequest(HttpMethod.PUT, '/paste/' + id, undefined, request)
    );
  }

  async deletePaste(id: string): Promise<ActionResponse> {
    return ensureSuccessfulResponse(
      await this.makeRequest(HttpMethod.DELETE, '/paste/' + id)
    );
  }

  async sharePaste(
    id: string,
    request: PasteShareRequest
  ): Promise<ActionResponse> {
    return ensureSuccessfulResponse(
      await this.makeRequest(
        HttpMethod.POST,
        '/paste/' + id + '/friend',
        undefined,
        request
      )
    );
  }
}
