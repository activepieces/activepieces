import { api } from '@/lib/api';
import {
  AddSigningKeyRequestBody,
  AddSigningKeyResponse,
  SigningKey,
  SigningKeyId,
} from '@ensemble/ee-shared';
import { SeekPage } from '@ensemble/shared';

export const signingKeyApi = {
  list() {
    return api.get<SeekPage<SigningKey>>('/v1/signing-keys');
  },
  delete(keyId: SigningKeyId) {
    return api.delete<void>(`/v1/signing-keys/${keyId}`);
  },
  create(request: AddSigningKeyRequestBody) {
    return api.post<AddSigningKeyResponse>(`/v1/signing-keys/`, request);
  },
};
