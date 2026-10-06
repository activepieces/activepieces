import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { googleTranslateAuth } from '../auth';
import { TRANSLATE_API_ROOT } from '../common/client';

export const customApiCall = createCustomApiCallAction({
  auth: googleTranslateAuth,
  baseUrl: () => TRANSLATE_API_ROOT,
  authMapping: async (auth) => ({
    Authorization: `Bearer ${auth.access_token}`,
  }),
});
