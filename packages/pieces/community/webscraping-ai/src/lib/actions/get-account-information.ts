import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const getAccountInformation = createAction({
  auth: webscrapingAiAuth,
  name: 'getAccountInformation',
  displayName: 'Get Account Info',
  description: 'Get account usage information including remaining API credits and concurrent requests.',
  props: {},
  async run({ auth: apiKey }) {
    return await webscrapingAiCommon.getAccountInformation({ apiKey });
  },
});
