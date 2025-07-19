import { api } from '@/lib/api';
import { ManagedAuthnRequestBody } from '@ensemble/ee-shared';
import { AuthenticationResponse } from '@ensemble/shared';

export const managedAuthApi = {
  generateApToken: async (request: ManagedAuthnRequestBody) => {
    return api.post<AuthenticationResponse>(
      `/v1/managed-authn/external-token`,
      request,
    );
  },
};
