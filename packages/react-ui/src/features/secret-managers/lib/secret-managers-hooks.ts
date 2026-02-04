import { secretManagersApi } from "./secret-managers-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ConnectSecretManagerRequest, SecretManagerProviderMetaData } from "@activepieces/shared";

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
    return useMutation<void, Error, ConnectSecretManagerRequest>({
      mutationFn: secretManagersApi.connect,
    });
  },

}