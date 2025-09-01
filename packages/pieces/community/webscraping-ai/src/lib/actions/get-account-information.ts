import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const getAccountInformation = createAction({
  auth: webscrapingAiAuth,
  name: 'getAccountInformation',
  displayName: 'Get Account Information',
  description: 'Returns usage data like remaining API credits.',
  props: {},
  async run({ auth: apiKey }) {
    return await webscrapingAiCommon.getAccountInformation({ apiKey });
  },
});
