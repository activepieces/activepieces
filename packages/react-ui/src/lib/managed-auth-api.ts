import { ManagedAuthnRequestBody } from '@activepieces/ee-shared';
import { AuthenticationResponse } from '@activepieces/shared';

import { api } from '@/lib/api';

export const managedAuthApi = {
  generateApToken: async (request: ManagedAuthnRequestBody) => {
    return api.post<AuthenticationResponse>(
      `/v1/managed-authn/external-token`,
      request,
    );
  },
};
