import { api } from '@/lib/api';
import {
  ListOAuth2AppRequest,
  OAuthApp,
  UpsertOAuth2AppRequest,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

export const oauthAppsApi = {
  listCloudOAuthApps(): Promise<Record<string, { clientId: string }>> {
    return api.get<Record<string, { clientId: string }>>(
      'https://secrets.activepieces.com/apps',
    );
  },
  listOAuthAppsCredentials(request: ListOAuth2AppRequest) {
    return api.get<SeekPage<OAuthApp>>('/v1/oauth-apps', request);
  },
  delete(credentialId: string) {
    return api.delete<void>(`/v1/oauth-apps/${credentialId}`);
  },
  upsert(request: UpsertOAuth2AppRequest) {
    return api.post<OAuthApp>('/v1/oauth-apps', request);
  },
};
