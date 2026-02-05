import { api } from '@/lib/api';
import {
  ConnectSecretManagerRequest,
  SecretManagerProviderMetaData,
} from '@activepieces/shared';

export const secretManagersApi = {
  list() {
    return api.get<SecretManagerProviderMetaData[]>('/v1/secret-managers');
  },
  connect(config: ConnectSecretManagerRequest) {
    return api.post<void>('/v1/secret-managers/connect', config);
  },
};
