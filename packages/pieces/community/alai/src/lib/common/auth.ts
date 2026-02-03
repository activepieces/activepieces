import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

const markdownDescription = `
Follow these steps to get your Alai API Key:

1. Go to [**https://getalai.com/api**](https://getalai.com/api) and sign up or log in.
2. Navigate to the **API Keys** section.
3. Click **Create API Key** and give it a name (e.g., "Activepieces").
4. Copy the key and paste it below.
`;

export const alaiAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Paste your API key here.',
      required: true,
    }),
  },
  async validate(auth) {
    const apiKey = auth.auth.apiKey;
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://slides-api.getalai.com/api/v1/ping',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return { valid: true };
    } catch (e) {
      if (e instanceof HttpError) {
        if (e.response.status === 401) {
          return { valid: false, error: 'Invalid API Key' };
        }
      }
      return { valid: false, error: 'Failed to connect to Alai API' };
    }
  },
});
