import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { OAuth2GrantType } from '@activepieces/shared';

export const wrikeAuth = PieceAuth.OAuth2({
  authUrl: 'https://www.wrike.com/oauth2/authorize/v4',
  tokenUrl: 'https://www.wrike.com/oauth2/token',
  grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
  required: true,
  scope: ['Default', 'wsReadWrite'],
});

export const taskIdProp = {
  displayName: 'Task ID',
  description: 'The ID of the task',
  type: 'string' as const,
  required: true,
};

export const folderIdProp = {
  displayName: 'Folder ID',
  description: 'The ID of the folder',
  type: 'string' as const,
  required: false,
};

export async function getWrikeApiUrl(auth: any): Promise<string> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://www.wrike.com/api/v4/account',
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });
  return response.body.data[0].host || 'https://www.wrike.com/api/v4';
}