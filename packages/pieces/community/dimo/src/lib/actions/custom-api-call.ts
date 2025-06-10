import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const customApiCallAction = createCustomApiCallAction({
  auth: dimoAuth,
  baseUrl: (auth: any) => auth.baseUrl || 'https://api.dimo.zone',
  authMapping: async (auth: any) => ({
    Authorization: `Bearer ${auth.vehicleJwt || auth.developerJwt}`,
  }),
}); 