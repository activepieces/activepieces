import { api } from '@/lib/api';
import {
  ApiKeyResponseWithoutValue,
  ApiKeyResponseWithValue,
  CreateApiKeyRequest,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

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
