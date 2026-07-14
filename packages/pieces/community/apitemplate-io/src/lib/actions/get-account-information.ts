import { createAction } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAccountInformation = createAction({
  auth: ApitemplateAuth,
  name: 'getAccountInformation',
  displayName: 'Get Account Information',
  description: 'Retrieves account information including usage statistics and account details.',
  audience: 'both',
  aiMetadata: { description: 'Fetches the APITemplate.io account profile, including plan and generation usage/quota stats. Use to check remaining quota or account status before generating documents. Read-only and idempotent; takes no input.', idempotent: true },
  props: {},
  async run({ auth }) {
    const authConfig = auth.props;

    const endpoint = '/account-information';

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.GET,
        endpoint,
        undefined,
        undefined,
        authConfig.region as ApitemplateRegion
      );

      return response;
    } catch (error: any) {
     
      if (error.message.includes('502') && authConfig.region !== 'default') {
        throw new Error(
          `${error.message}\n\nThe ${authConfig.region} region appears to be experiencing issues. ` +
          `Consider switching to the 'default' region in your authentication settings or try again later.`
        );
      }
      throw error;
    }
  },
});