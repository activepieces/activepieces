import { PieceAuth } from "@activepieces/pieces-framework";
import { HttpError, HttpMethod, httpClient } from "@activepieces/pieces-common";

const markdownDescription = `
Follow these steps to get your Vadoo AI API Key:
1. Go to your Vadoo AI profile page at **[https://ai.vadoo.tv/profile](https://ai.vadoo.tv/profile)**.
2. Click **Generate API Key** and copy the generated key.
3. Paste the API key into the field below.
`;

export const vadooAiAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: "API Key",
      description: "Paste your Vadoo AI API key here.",
      required: true,
    }),
  },
  validate: async (auth) => {
    const { apiKey } = auth.auth;

    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://viralapi.vadoo.tv/api/get_video_url',
        queryParams: {
            vid: 'activepieces_validation'
        },
        headers: {
          'X-API-KEY': apiKey,
        },
      });
      return { valid: true };
    } catch (e) {
      if (e instanceof HttpError) {
        // SUCCESS: For Vadoo, a 400 on this endpoint proves the key was accepted.
        if (e.response.status === 400) {
          return { valid: true };
        }
        // FAILURE: 401/403 means the key is invalid.
        if (e.response.status === 401 || e.response.status === 403) {
          return { valid: false, error: 'Invalid API Key' };
        }
      }
      // Handle other issues like network errors.
      return { valid: false, error: 'Failed to connect to Vadoo AI API.' };
    }
  },
});