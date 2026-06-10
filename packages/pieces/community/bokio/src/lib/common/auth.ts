import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const bokioAuth = PieceAuth.CustomAuth({
  displayName: 'Bokio API Key',
  description: 'Bokio API Key is required to authenticate requests to Bokio',
  required: true,
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'Enter your Bokio Company ID ',
      required: true,
    }),
    api_key: Property.ShortText({
      displayName: 'API Key',
      description: 'Enter your Bokio API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(
          auth.api_key,
          HttpMethod.GET,
          `/companies/${auth.companyId}/journal-entries`
        );
        return {
          valid: true,
        };
      } catch (e) {
        return {
          valid: false,
          error: 'Invalid Api Key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
});
