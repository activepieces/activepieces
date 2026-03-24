import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const API_BASE = 'https://api.pcloud.com';

export interface PCloudItem {
  name: string;
  created: string;
  modified: string;
  isfolder: boolean;
  parentfolderid: number;
  fileid?: number;
  folderid?: number;
  size?: number;
  hash?: string;
  contenttype?: string;
}

export interface PCloudFolder {
  folderid: number;
  name: string;
  created: string;
  modified: string;
  parentfolderid: number;
  contents: PCloudItem[];
}

export class PCloudClient {
  constructor(private auth: OAuth2PropertyValue) {}

  private get authHeader() {
    return {
      type: AuthenticationType.BEARER_TOKEN as const,
      token: this.auth.access_token,
    };
  }

  async listFolder(folderId: number): Promise<PCloudFolder> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/listfolder`,
      queryParams: {
        folderid: folderId.toString(),
      },
      authentication: this.authHeader,
    });

    if (response.body.result !== 0) {
      throw new Error(`pCloud API error: ${response.body.error}`);
    }

    return response.body.metadata;
  }

  async createFolder(
    parentFolderId: number,
    name: string,
  ): Promise<PCloudFolder> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/createfolder`,
      queryParams: {
        parentfolderid: parentFolderId.toString(),
        name,
      },
      authentication: this.authHeader,
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to create folder: ${response.body.error}`);
    }

    return response.body.metadata;
  }

  async uploadFile(
    folderId: number,
    fileName: string,
    fileContent: Buffer,
  ): Promise<PCloudItem> {
    const formData = new FormData();
    formData.append('file', new Blob([fileContent]), fileName);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${API_BASE}/uploadfile`,
      queryParams: {
        folderid: folderId.toString(),
        filename: fileName,
      },
      body: formData,
      authentication: this.authHeader,
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to upload file: ${response.body.error}`);
    }

    const item = response.body.metadata?.[0];
    if (!item) {
      throw new Error('pCloud upload returned no file metadata');
    }
    return item;
  }

  async downloadFileLink(fileId: number): Promise<string> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/getfilelink`,
      queryParams: {
        fileid: fileId.toString(),
      },
      authentication: this.authHeader,
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to get download link: ${response.body.error}`);
    }

    const host = response.body.hosts[0];
    const path = response.body.path;
    return `https://${host}${path}`;
  }

  async copyFile(
    fileId: number,
    toFolderId: number,
    newName?: string,
  ): Promise<PCloudItem> {
    const params: Record<string, string> = {
      fileid: fileId.toString(),
      tofolderid: toFolderId.toString(),
    };

    if (newName) {
      params['toname'] = newName;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/copyfile`,
      queryParams: params,
      authentication: this.authHeader,
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to copy file: ${response.body.error}`);
    }

    return response.body.metadata;
  }

  async getFileMetadata(fileId: number): Promise<PCloudItem> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/stat`,
      queryParams: {
        fileid: fileId.toString(),
      },
      authentication: this.authHeader,
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to get file metadata: ${response.body.error}`);
    }

    return response.body.metadata;
  }
}
