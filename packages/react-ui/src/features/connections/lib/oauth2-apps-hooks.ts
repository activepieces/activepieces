import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import { AppConnectionType } from '@activepieces/shared';

import { oauthAppsApi } from './oauth2-apps-api';

type PieceToClientIdMap = {
  [pieceName: string]: {
    type: AppConnectionType.CLOUD_OAUTH2 | AppConnectionType.PLATFORM_OAUTH2;
    clientId: string;
  };
};

export const oauth2AppsHooks = {
  usePieceToClientIdMap(cloudAuthEnabled: boolean) {
    return useQuery<PieceToClientIdMap, Error>({
      queryKey: ['oauth-apps'],
      queryFn: async () => {
        const apps = await oauthAppsApi.listOAuthAppsCredentials({
          limit: 1000000,
          cursor: undefined,
          projectId: authenticationSession.getProjectId(),
        });
        const cloudApps = !cloudAuthEnabled
          ? {}
          : await oauthAppsApi.listCloudOAuthApps();
        const appsMap: PieceToClientIdMap = {};
        Object.keys(cloudApps).forEach((key) => {
          appsMap[key] = {
            type: AppConnectionType.CLOUD_OAUTH2,
            clientId: cloudApps[key].clientId,
          };
        });
        apps.data.forEach((app) => {
          appsMap[app.pieceName] = {
            type: AppConnectionType.PLATFORM_OAUTH2,
            clientId: app.clientId,
          };
        });
        return appsMap;
      },
      staleTime: 0,
    });
  },
};
