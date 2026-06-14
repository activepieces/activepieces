import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { JungleGridApiError, jungleGridCommon } from './common';

export const jungleGridAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description:
    'Connect with a scoped Jungle Grid API key. Use the default API base URL unless your workspace provides a custom endpoint.',
  required: true,
  props: {
    api_base_url: Property.ShortText({
      displayName: 'API Base URL',
      description:
        'Base URL for the Jungle Grid API. Keep the default unless Jungle Grid provides a specific endpoint for your workspace.',
      required: true,
      defaultValue: jungleGridCommon.defaultBaseUrl,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Paste a scoped Jungle Grid API key from the Jungle Grid portal.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await jungleGridCommon.apiCall({
        auth,
        method: HttpMethod.GET,
        path: jungleGridCommon.endpoints.listJobs,
        queryParams: {
          limit: '1',
        },
      });

      return {
        valid: true,
      };
    } catch (error) {
      if (error instanceof JungleGridApiError) {
        return {
          valid: false,
          error: error.message,
        };
      }

      return {
        valid: false,
        error: 'Unable to validate the Jungle Grid connection.',
      };
    }
  },
});
