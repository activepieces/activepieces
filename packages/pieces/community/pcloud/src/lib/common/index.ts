import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export interface PCloudFile {
  fileid: number;
  name: string;
  size: number;
  contenttype: string;
  created: string;
  modified: string;
  isfolder: boolean;
  parentfolderid: number;
}

export interface PCloudFolder {
  folderid: number;
  name: string;
  created: string;
  modified: string;
  contents?: (PCloudFile | PCloudFolder)[];
}

export interface PCloudApiResponse {
  result: number;
  error?: string;
  metadata?: PCloudFile | PCloudFolder;
  fileids?: number[];
}

export class PCloudClient {
  constructor(private auth: OAuth2PropertyValue) {}

  private getApiUrl(): string {
    return 'https://api.pcloud.com';
  }

  async makeRequest<T = unknown>(
    method: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    const url = `${this.getApiUrl()}/${method}`;
    const queryParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      queryParams[key] = String(value);
    });

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.auth.access_token,
      },
    };

    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  }

  async uploadFile(
    fileName: string,
    fileData: string,
    folderId: number = 0
  ): Promise<PCloudApiResponse> {
    const buffer = Buffer.from(fileData, 'base64');
    const url = `${this.getApiUrl()}/uploadfile`;

    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('folderid', folderId.toString());
    form.append('filename', fileName);
    form.append('file', buffer, fileName);

    const response = await httpClient.sendRequest<PCloudApiResponse>({
      method: HttpMethod.POST,
      url,
      body: form,
      headers: {
        ...form.getHeaders(),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.auth.access_token,
      },
    });

    return response.body;
  }

  async createFolder(
    name: string,
    parentFolderId: number = 0
  ): Promise<PCloudApiResponse> {
    return this.makeRequest<PCloudApiResponse>('createfolder', {
      folderid: parentFolderId,
      name,
    });
  }

  async listFolder(folderId: number = 0): Promise<PCloudApiResponse> {
    return this.makeRequest<PCloudApiResponse>('listfolder', {
      folderid: folderId,
      recursive: 0,
    });
  }

  async getFileLink(fileId: number): Promise<PCloudApiResponse & { link?: string }> {
    return this.makeRequest<PCloudApiResponse & { link?: string }>('getfilelink', {
      fileid: fileId,
    });
  }

  async copyFile(
    fileId: number,
    toFolderId: number,
    overwrite: boolean = false
  ): Promise<PCloudApiResponse> {
    return this.makeRequest<PCloudApiResponse>('copyfile', {
      fileid: fileId,
      tofolderid: toFolderId,
      overwrite: overwrite ? 1 : 0,
    });
  }
}
