import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { HELP_SCOUT_API_URL } from '../common/client';

export const customApiCall = createCustomApiCallAction({
  baseUrl: () => HELP_SCOUT_API_URL,
  auth: helpScoutAuth,
  authMapping: async (auth: any) => ({
    Authorization: `Bearer ${auth.apiKey}`,
  }),
});