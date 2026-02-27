import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
Follow these instructions to get your API Key:
1. Visit the following website: https://makersuite.google.com/app/apikey
2. Once on the website, locate and click on the option to obtain your API Key.
Please note this piece uses a API in the beta phase that may change at any time.
`;

export const googleGeminiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url:
          'https://generativelanguage.googleapis.com/v1beta/models?key=' +
          auth.auth,
        method: HttpMethod.GET,
      });
      return {
        valid: true,
      };
    } catch (e: any) {
      const extraErrorInfo = e.response?.body?.error?.message
        ? `${e.response?.body?.error?.message} status:${e.response?.body?.error?.code}`
        : e;
      return {
        valid: false,
        error: `${extraErrorInfo}`,
      };
    }
  },
});
