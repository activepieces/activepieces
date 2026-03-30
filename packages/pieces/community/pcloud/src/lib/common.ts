import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const pcloudCommon = {
  httpClient,
  
  async listFolder(params: { folderId?: number; path?: string; accessToken: string }) {
    const queryParams: Record<string, any> = {};
    
    if (params.folderId !== undefined) {
      queryParams.folderid = params.folderId;
    } else if (params.path) {
      queryParams.path = params.path;
    } else {
      queryParams.folderid = 0;
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/listfolder',
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: params.accessToken,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to list folder: ${JSON.stringify(result.body)}`);
    }

    return result.body;
  },
};
