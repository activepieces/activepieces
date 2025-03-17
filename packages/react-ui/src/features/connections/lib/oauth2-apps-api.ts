import { api } from '@/lib/api';
import {
  GlobalOAuthApp,
  ListOAuth2AppRequest,
  OAuthApp,
  UpsertOAuth2AppRequest,
} from '@activepieces/shared';
import { ApEdition, SeekPage } from '@activepieces/shared';

export const oauthAppsApi = {
  listCloudOAuthApps(
    edition: ApEdition,
  ): Promise<Record<string, { clientId: string }>> {
    return api.get<Record<string, { clientId: string }>>(
      'https://secrets.activepieces.com/apps',
      {
        edition,
      },
    );
  },
  listGlobalOAuthAppsCredentials(request: ListOAuth2AppRequest) {
    return api.get<SeekPage<GlobalOAuthApp>>('/v1/global-oauth-apps', request);
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
