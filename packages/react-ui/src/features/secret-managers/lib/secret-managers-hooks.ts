import { secretManagersApi } from "./secret-managers-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ConnectSecretManagerRequest, SecretManagerProviderMetaData } from "@activepieces/shared";

export const secretManagersHooks = {
  useSecretManagers: () => {
    return useQuery<SecretManagerProviderMetaData[]>({
      queryKey: ['secret-managers'],
      queryFn: secretManagersApi.list,
    });
  },
  useConnectSecretManager: () => {
    return useMutation<void, Error, ConnectSecretManagerRequest>({
      mutationFn: secretManagersApi.connect,
    });
  },

}