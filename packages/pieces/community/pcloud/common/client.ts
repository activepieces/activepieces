import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const API_BASE = 'https://api.pcloud.com';

export interface PCloudFile {
  id: number;
  name: string;
  size: number;
  created: number;
  modified: number;
  isdir: boolean;
  parentfolderid?: number;
  hash?: string;
  contenttype?: string;
}

export interface PCloudFolder {
  folderid: number;
  name: string;
  created: number;
  modified: number;
  parentfolderid: number;
  contents: PCloudFile[];
}

export class PCloudClient {
  constructor(private auth: OAuth2PropertyValue) {}

  async listFolder(folderid: number): Promise<PCloudFolder> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/listfolder`,
      queryParams: {
        folderid: folderid.toString(),
        access_token: this.auth.access_token,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(`pCloud API error: ${response.body.error}`);
    }

    return response.body.metadata;
  }

  async createFolder(parentFolderid: number, name: string): Promise<PCloudFolder> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/createfolder`,
      queryParams: {
        parentfolderid: parentFolderid.toString(),
        name: encodeURIComponent(name),
        access_token: this.auth.access_token,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to create folder: ${response.body.error}`);
    }

    return response.body.metadata;
  }

  async uploadFile(
    parentFolderid: number,
    fileName: string,
    fileContent: Buffer,
  ): Promise<PCloudFile> {
    const formData = new FormData();
    formData.append('parentfolderid', parentFolderid.toString());
    formData.append('filename', fileName);
    formData.append('file', new Blob([fileContent]), fileName);
    formData.append('access_token', this.auth.access_token);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${API_BASE}/uploadfile`,
      body: formData,
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to upload file: ${response.body.error}`);
    }

    return response.body.fileids[0];
  }

  async downloadFile(fileid: number): Promise<Buffer> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/getfile`,
      queryParams: {
        fileid: fileid.toString(),
        access_token: this.auth.access_token,
      },
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.body);
  }

  async copyFile(fileid: number, toFolderid: number, newName?: string): Promise<PCloudFile> {
    const params: Record<string, string> = {
      fileid: fileid.toString(),
      tofolderid: toFolderid.toString(),
      access_token: this.auth.access_token,
    };

    if (newName) {
      params.newname = encodeURIComponent(newName);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/copyfile`,
      queryParams: params,
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to copy file: ${response.body.error}`);
    }

    return response.body.metadata;
  }

  async getFileMetadata(fileid: number): Promise<PCloudFile> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/stat`,
      queryParams: {
        fileid: fileid.toString(),
        access_token: this.auth.access_token,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to get file metadata: ${response.body.error}`);
    }

    return response.body.metadata;
  }

  async getFolderMetadata(folderid: number): Promise<PCloudFolder> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/stat`,
      queryParams: {
        folderid: folderid.toString(),
        access_token: this.auth.access_token,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to get folder metadata: ${response.body.error}`);
    }

    return response.body.metadata;
  }

  async searchFiles(
    parentFolderid: number,
    query: string,
  ): Promise<PCloudFile[]> {
    const results: PCloudFile[] = [];
    const folder = await this.listFolder(parentFolderid);

    for (const item of folder.contents) {
      if (item.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(item);
      }
      if (item.isdir) {
        const nestedResults = await this.searchFiles(item.id, query);
        results.push(...nestedResults);
      }
    }

    return results;
  }

  async searchFolders(
    parentFolderid: number,
    query: string,
  ): Promise<PCloudFolder[]> {
    const results: PCloudFolder[] = [];
    const folder = await this.listFolder(parentFolderid);

    for (const item of folder.contents) {
      if (item.isdir && item.name.toLowerCase().includes(query.toLowerCase())) {
        const folderMeta = await this.getFolderMetadata(item.id);
        results.push(folderMeta);
      }
      if (item.isdir) {
        const nestedResults = await this.searchFolders(item.id, query);
        results.push(...nestedResults);
      }
    }

    return results;
  }

  async deleteFile(fileid: number): Promise<void> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/deletefile`,
      queryParams: {
        fileid: fileid.toString(),
        access_token: this.auth.access_token,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to delete file: ${response.body.error}`);
    }
  }

  async deleteFolder(folderid: number): Promise<void> {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE}/deletefolder`,
      queryParams: {
        folderid: folderid.toString(),
        access_token: this.auth.access_token,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(`Failed to delete folder: ${response.body.error}`);
    }
  }
}
