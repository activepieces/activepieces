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
        // const apps =
        //   edition === ApEdition.COMMUNITY
        //     ? {
        //         data: [],
        //       }
        //     : await oauthAppsApi.listOAuthAppsCredentials({
        //         limit: 1000000,
        //         cursor: undefined,
        //       });
        // const cloudApps = !cloudAuthEnabled
        //   ? {}
        //   : await oauthAppsApi.listCloudOAuthApps(edition);

        // Todo (Rupal): Ideally, we should use cloud auth and modify it to suit our needs but this will do. i.e. global oauth apps
        const apps = await oauthAppsApi.listOAuthAppsCredentials({ limit: 10000, cursor: undefined});
        const cloudApps = await oauthAppsApi.listGlobalOAuthAppsCredentials({ limit: 10000, cursor: undefined});

        const appsMap: PieceToClientIdMap = {};
        // Object.keys(cloudApps).forEach((key) => {
        //   appsMap[key] = {
        //     type: AppConnectionType.CLOUD_OAUTH2,
        //     clientId: cloudApps[key].clientId,
        //   };
        // });
        cloudApps.data.forEach((app) => {
          Object.keys(cloudApps).forEach((key) => {
            appsMap[app.pieceName] = {
              type: AppConnectionType.CLOUD_OAUTH2,
              clientId: app.clientId,
            };
          });
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
