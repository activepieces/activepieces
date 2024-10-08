import { useQuery } from '@tanstack/react-query';

import { ApEdition, AppConnectionType } from '@activepieces/shared';

import { oauthAppsApi } from './oauth2-apps-api';

type PieceToClientIdMap = {
  [pieceName: string]: {
    type: AppConnectionType.CLOUD_OAUTH2 | AppConnectionType.PLATFORM_OAUTH2;
    clientId: string;
  };
};

export const oauth2AppsHooks = {
  useOAuth2AppConfigured(pieceId: string) {
    const query = useQuery({
      queryKey: ['oauth2-apps-configured'],
      queryFn: async () => {
        const response = await oauthAppsApi.listOAuthAppsCredentials({
          limit: 1000000,
        });
        return response.data;
      },
      select: (data) => {
        return data.find((app) => app.pieceName === pieceId);
      },
      staleTime: Infinity,
    });
    return {
      refetch: query.refetch,
      oauth2App: query.data,
    };
  },
  usePieceToClientIdMap(cloudAuthEnabled: boolean, edition: ApEdition) {
    return useQuery<PieceToClientIdMap, Error>({
      queryKey: ['oauth-apps'],
      queryFn: async () => {
        const apps =
          edition === ApEdition.COMMUNITY
            ? {
                data: [],
              }
            : await oauthAppsApi.listOAuthAppsCredentials({
                limit: 1000000,
                cursor: undefined,
              });
        const cloudApps = !cloudAuthEnabled
          ? {}
          : await oauthAppsApi.listCloudOAuthApps(edition);
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
