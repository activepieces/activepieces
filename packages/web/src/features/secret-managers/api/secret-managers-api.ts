import {
  ConnectSecretManagerRequest,
  SeekPage,
  SecretManagerConnectionWithStatus,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const secretManagersApi = {
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
