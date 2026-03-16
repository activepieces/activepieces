import {
  ConnectSecretManagerRequest,
  SeekPage,
  SecretManagerConnectionWithStatus,
  SecretManagerProviderMetaData,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const secretManagersApi = {
  listProviders() {
    return api.get<SecretManagerProviderMetaData[]>(
      '/v1/secret-managers/providers',
    );
  },
  list(params?: { projectId?: string }) {
    return api.get<SeekPage<SecretManagerConnectionWithStatus>>(
      '/v1/secret-managers',
      params,
    );
  },
  create(config: ConnectSecretManagerRequest) {
    return api.post<SecretManagerConnectionWithStatus>(
      '/v1/secret-managers',
      config,
    );
  },
  update(id: string, config: ConnectSecretManagerRequest) {
    return api.post<SecretManagerConnectionWithStatus>(
      `/v1/secret-managers/${id}`,
      config,
    );
  },
  delete(id: string) {
    return api.delete<void>(`/v1/secret-managers/${id}`);
  },
  clearCache(connectionId?: string) {
    return api.delete<void>(
      '/v1/secret-managers/cache',
      connectionId ? { connectionId } : undefined,
    );
  },
};
