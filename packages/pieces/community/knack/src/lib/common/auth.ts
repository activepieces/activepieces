import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { knackApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const knackAuth = PieceAuth.CustomAuth({
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Knack API Key available in the Settings section of the Builder.',
      required: true,
    }),
    applicationId: Property.ShortText({
      displayName: 'Application ID',
      description: 'Your Application ID available in the Settings section of the Builder.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await knackApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/objects',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key or Application ID',
      };
    }
  },
  required: true,
});
