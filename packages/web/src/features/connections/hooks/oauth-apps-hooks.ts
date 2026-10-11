import { ApEdition, ApFlagId, AppConnectionType } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { PiecesOAuth2AppsMap } from '@/features/connections/utils/oauth2-utils';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { oauthAppsApi } from '../api/oauth-apps';

export const oauthAppsQueries = {
  useOAuthAppConfigured(pieceId: string) {
    const query = useQuery({
      queryKey: ['oauth2-apps-configured'],
      queryFn: async () => {
        const response = await oauthAppsApi.listPlatformOAuth2Apps({
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
  usePiecesOAuth2AppsMap() {
    const { platform } = platformHooks.useCurrentPlatform();
    const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

    return useQuery<PiecesOAuth2AppsMap, Error>({
      queryKey: ['oauth-apps'],
      queryFn: async () => {
        const apps =
          edition === ApEdition.COMMUNITY
            ? {
                data: [],
              }
            : await oauthAppsApi.listPlatformOAuth2Apps({
                limit: 1000000,
                cursor: undefined,
              });
        const cloudApps = !platform.cloudAuthEnabled
          ? {}
          : await oauthAppsApi.listCloudOAuth2Apps(edition!);
        const appsMap: PiecesOAuth2AppsMap = {};

        Object.entries(cloudApps).forEach(([pieceName, app]) => {
          appsMap[pieceName] = {
            cloudOAuth2App: {
              oauth2Type: AppConnectionType.CLOUD_OAUTH2,
              clientId: app.clientId,
            },
            platformOAuth2App: null,
          };
        });
        apps.data.forEach((app) => {
          appsMap[app.pieceName] = {
            platformOAuth2App: {
              oauth2Type: AppConnectionType.PLATFORM_OAUTH2,
              clientId: app.clientId,
            },
            cloudOAuth2App: appsMap[app.pieceName]?.cloudOAuth2App ?? null,
          };
        });
        return appsMap;
      },
      staleTime: 0,
    });
  },
};
