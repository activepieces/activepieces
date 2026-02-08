import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAccessToken, getApiUrl } from './auth';

export interface PCloudFile {
  fileid: number;
  name: string;
  size: number;
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

export async function makeApiCall(
  auth: OAuth2PropertyValue,
  method: string,
  params: Record<string, any> = {}
): Promise<any> {
  const apiUrl = getApiUrl(auth);
  const accessToken = getAccessToken(auth);

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${apiUrl}/${method}`,
    queryParams: {
      access_token: accessToken,
      ...params,
    },
  });

  if (response.body.result !== 0) {
    throw new Error(`pCloud API error: ${response.body.error || 'Unknown error'}`);
  }

  return response.body;
}

export async function listFolder(
  auth: OAuth2PropertyValue,
  folderId: number = 0
): Promise<PCloudFolder> {
  const result = await makeApiCall(auth, 'listfolder', {
    folderid: folderId,
  });

  return result.metadata;
}
