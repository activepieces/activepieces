import {
  ApiKeyResponseWithoutValue,
  ApiKeyResponseWithValue,
  CreateApiKeyRequest,
  SeekPage,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const apiKeyApi = {
  list() {
    return api.get<SeekPage<ApiKeyResponseWithoutValue>>('/v1/api-keys');
  },
  delete(keyId: string) {
    return api.delete<void>(`/v1/api-keys/${keyId}`);
  },
  create(request: CreateApiKeyRequest) {
    return api.post<ApiKeyResponseWithValue>(`/v1/api-keys/`, request);
  },
};
