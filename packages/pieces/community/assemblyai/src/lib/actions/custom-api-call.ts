import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { assemblyaiAuth } from '../auth';
import { baseUrl } from '../client';

export const customApiCall = createCustomApiCallAction({
  auth: assemblyaiAuth,
  baseUrl: () => 'https://api.assemblyai.com',
  props: {
    url: {
      description: `Full URL, or a path relative to ${baseUrl}`,
      placeholder: '/v2/transcript',
    },
  },
  authMapping: async (auth) => {
    return {
      Authorization: `${auth.secret_text}`,
    };
  },
});
