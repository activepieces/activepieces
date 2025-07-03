import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { assemblyaiAuth } from '../auth';

export const customApiCall = createCustomApiCallAction({
  auth: assemblyaiAuth,
  baseUrl: () => 'https://api.assemblyai.com',
  authMapping: async (auth) => {
    return {
      Authorization: `${auth}`,
    };
  },
});
