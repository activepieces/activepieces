import {
  ApEdition,
  ApFlagId,
  AppConnectionType,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { PiecesOAuth2AppsMap } from '@/features/connections/utils/oauth2-utils';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { oauthAppsApi } from '../api/oauth-apps';

export const oauthAppsQueries = {
  useOAuthAppConfigured(_pieceId: string) {
    return {
      refetch: () => {},
      oauth2App: undefined,
    };
  },
  usePiecesOAuth2AppsMap() {
    const { platform } = platformHooks.useCurrentPlatform();
    const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

    return useQuery<PiecesOAuth2AppsMap, Error>({
      queryKey: ['oauth-apps'],
      queryFn: async () => {
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
        return appsMap;
      },
      staleTime: 0,
    });
  },
};

export type PieceToClientIdMap = {
  [
    pieceName: `${string}-${
      | AppConnectionType.CLOUD_OAUTH2
      | AppConnectionType.PLATFORM_OAUTH2}`
  ]: {
    oauth2Type:
      | AppConnectionType.CLOUD_OAUTH2
      | AppConnectionType.PLATFORM_OAUTH2;
    clientId: string;
  };
};
