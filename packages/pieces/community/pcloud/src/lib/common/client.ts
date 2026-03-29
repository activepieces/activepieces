import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { API_BASE_URL } from '../auth';

/**
 * pCloud API Client
 * Handles all API calls to pCloud
 */
export class PCloudClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Make a pCloud API call
   */
  private async call(method: string, params: Record<string, string | number> = {}) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_BASE_URL}/${method}`,
      queryParams: {
        access_token: this.accessToken,
        ...params,
      },
    });

    return response.body;
  }

  /**
   * List folder contents
   */
  async listFolder(folderId: string = '0') {
    return this.call('listfolder', { folderid: folderId });
  }

  /**
   * Create a new folder
   */
  async createFolder(folderId: string, name: string) {
    return this.call('createfolder', { folderid: folderId, name });
  }

  /**
   * Upload a file
   */
  async uploadFile(folderId: string, filename: string, content: string) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${API_BASE_URL}/uploadfile`,
      queryParams: {
        access_token: this.accessToken,
        folderid: folderId,
      },
      body: {
        type: 'file',
        filename: filename,
        data: content,
      },
    });

    return response.body;
  }

  /**
   * Get file link for download
   */
  async getFileLink(fileId: string) {
    return this.call('getfilelink', { fileid: fileId });
  }

  /**
   * Copy file
   */
  async copyFile(fileId: string, toFolderId: string, toName?: string) {
    const params: any = { fileid: fileId, tofolderid: toFolderId };
    if (toName) params.toname = toName;
    return this.call('copyfile', params);
  }

  /**
   * Move/rename file
   */
  async moveFile(fileId: string, toFolderId: string, toName?: string) {
    const params: any = { fileid: fileId, tofolderid: toFolderId };
    if (toName) params.toname = toName;
    return this.call('renamefile', params);
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string) {
    return this.call('deletefile', { fileid: fileId });
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId: string) {
    return this.call('deletefolder', { folderid: folderId });
  }

  /**
   * Search files
   */
  async search(query: string) {
    return this.call('searchfile', { query });
  }
}
