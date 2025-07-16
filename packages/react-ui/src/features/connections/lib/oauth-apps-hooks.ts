import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { toast } from '@/components/ui/use-toast';
import { UpsertOAuth2AppRequest } from '@activepieces/ee-shared';
import { ApEdition, AppConnectionType } from '@activepieces/shared';

import { oauthAppsApi } from './api/oauth-apps';

export type PieceToClientIdMap = {
  //key is set like this, to avoid issues reconnecting to a cloud oauth2 app after setting a platform oauth2 app
  [
    pieceName: `${string}-${
      | AppConnectionType.CLOUD_OAUTH2
      | AppConnectionType.PLATFORM_OAUTH2}`
  ]: {
    type: AppConnectionType.CLOUD_OAUTH2 | AppConnectionType.PLATFORM_OAUTH2;
    clientId: string;
  };
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
          appsMap[`${key}-${AppConnectionType.CLOUD_OAUTH2}`] = {
            type: AppConnectionType.CLOUD_OAUTH2,
            clientId: cloudApps[key].clientId,
          };
        });
        apps.data.forEach((app) => {
          appsMap[`${app.pieceName}-${AppConnectionType.PLATFORM_OAUTH2}`] = {
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
