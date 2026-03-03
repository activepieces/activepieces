import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export const weblingAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      defaultValue: 'example.webling.ch',
    }),
    apikey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://${auth.baseUrl}/api/1/member`,
        headers: {
          apikey: auth.apikey,
        },
      };
      await httpClient.sendRequest(request);
      return {
        valid: true,
      };
    } catch (e: any) {
      return {
        valid: false,
        error: e?.message,
      };
    }
  },
});
