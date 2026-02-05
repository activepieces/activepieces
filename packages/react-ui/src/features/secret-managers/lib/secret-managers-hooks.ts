import { secretManagersApi } from "./secret-managers-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApErrorParams, ConnectSecretManagerRequest, ErrorCode, SecretManagerProviderMetaData } from "@activepieces/shared";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { t } from "i18next";
import { internalErrorToast } from "@/components/ui/sonner";

export const secretManagersHooks = {
  useSecretManagers: ({ connectedOnly }: { connectedOnly?: boolean } = {}) => {
    return useQuery<SecretManagerProviderMetaData[]>({
      queryKey: ['secret-managers'],
      queryFn: async () => {
         const secretManagers = await secretManagersApi.list()
         if (connectedOnly) {
          return secretManagers.filter(secretManager => secretManager.connected)
         }
         return secretManagers
        },
    });
  },
  useConnectSecretManager: () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, ConnectSecretManagerRequest>({
      mutationFn: secretManagersApi.connect,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['secret-managers'] });
        toast.success(t('Connected successfully'))
      },
      onError: (error) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          switch (apError.code) {
            case ErrorCode.SECRET_MANAGER_CONNECTION_FAILED: {
              toast.error(t('Failed to connect to secret manager with error: "{msg}"', {
                msg: apError.params.message,
              }))
              return;
            }
          }
        }
        internalErrorToast();
      },
    });
  },

}