import { api } from '@/lib/api';
import { ListAppConnectionsRequestQuery, SeekPage } from '@activepieces/shared';

export const oauthAppsApi = {
  listCloudOAuthApps(): Promise<Record<string, { clientId: string }>> {
    return api.get<Record<string, { clientId: string }>>(
      'https://secrets.activepieces.com/apps',
    );
  },
  listOAuthAppsCredentials(request: ListAppConnectionsRequestQuery) {
    return api.get<SeekPage<any>>('/v1/oauth-apps', request);
  },
  delete(credentialId: string) {
    return api.delete<void>(`/v1/oauth-apps/${credentialId}`);
  },
  upsert(request: any) {
    return api.post<any>('/v1/oauth-apps', request);
  },
};
