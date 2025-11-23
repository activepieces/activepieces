import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { toast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { OAuth2App } from '@/lib/oauth2-utils';
import { UpsertOAuth2AppRequest } from '@activepieces/ee-shared';
import { ApEdition, ApFlagId, AppConnectionType } from '@activepieces/shared';

import { oauthAppsApi } from './api/oauth-apps';

const makeAppKey = (pieceName: string, type: AppConnectionType.CLOUD_OAUTH2 | AppConnectionType.PLATFORM_OAUTH2) => `${pieceName}-${type}` as const;

export const getPredefinedOAuth2App = (
  pieceToClientIdMap: PieceToClientIdMap,
  pieceName: string,
): OAuth2App | null => {
  const platformApp =
    pieceToClientIdMap[
      makeAppKey(pieceName, AppConnectionType.PLATFORM_OAUTH2)
    ];
  const cloudApp =
    pieceToClientIdMap[makeAppKey(pieceName, AppConnectionType.CLOUD_OAUTH2)];
  if (platformApp) {
    return platformApp;
  }
  if (cloudApp) {
    return cloudApp;
  }
  return null;
};

export const oauthAppsMutations = {
  
  useDeleteOAuthApp: (refetch: () => void, setOpen: (open: boolean) => void) =>
    useMutation({
      mutationFn: async (credentialId: string) => {
        await oauthAppsApi.delete(credentialId);
        refetch();
      },
      onSuccess: () => {
        toast({
          title: t('Success'),
          description: t('OAuth2 Credentials Deleted'),
          duration: 3000,
        });
        setOpen(false);
      },
    }),

  useUpsertOAuthApp: (
    refetch: () => void,
    setOpen: (open: boolean) => void,
    onConfigurationDone: () => void,
  ) =>
    useMutation({
      mutationFn: async (request: UpsertOAuth2AppRequest) => {
        await oauthAppsApi.upsert(request);
        refetch();
      },
      onSuccess: () => {
        toast({
          title: t('Success'),
          description: t('OAuth2 Credentials Updated'),
          duration: 3000,
        });
        onConfigurationDone();
        setOpen(false);
      },
    }),
};

export const oauthAppsQueries = {
  useOAuthAppConfigured(pieceId: string) {
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
  usePieceToClientIdMap() {
    const { platform } = platformHooks.useCurrentPlatform();
    const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

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
        const cloudApps = !platform.cloudAuthEnabled
          ? {}
          : await oauthAppsApi.listCloudOAuthApps(edition!);
        const appsMap: PieceToClientIdMap = {};
        Object.keys(cloudApps).forEach((key) => {
          appsMap[makeAppKey(key, AppConnectionType.CLOUD_OAUTH2)] = {
            oauth2Type: AppConnectionType.CLOUD_OAUTH2,
            clientId: cloudApps[key].clientId,
          };
        });
        apps.data.forEach((app) => {
          appsMap[
            makeAppKey(app.pieceName, AppConnectionType.PLATFORM_OAUTH2)
          ] = {
            oauth2Type: AppConnectionType.PLATFORM_OAUTH2,
            clientId: app.clientId,
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