import {
  ConnectSecretManagerRequest,
  DisconnectSecretManagerRequest,
  SecretManagerProviderMetaData,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

import { api } from '@/lib/api';

export const secretManagersApi = {
  list() {
    return api.get<SeekPage<SecretManagerProviderMetaData>>(
      '/v1/secret-managers',
    );
  },
  connect(config: ConnectSecretManagerRequest) {
    return api.post<void>('/v1/secret-managers/connect', config);
  },
  disconnect(request: DisconnectSecretManagerRequest) {
    return api.delete<void>('/v1/secret-managers/disconnect', request);
  },
  clearCache() {
    return api.delete<void>('/v1/secret-managers/cache');
  },
};
