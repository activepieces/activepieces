import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
To get your API key:
1. Open [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API key** and copy the key.

This piece uses Gemini's beta API, which Google may change at any time.
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
