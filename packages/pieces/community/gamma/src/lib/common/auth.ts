import { PieceAuth } from "@activepieces/pieces-framework";
import { HttpError, HttpMethod, httpClient } from "@activepieces/pieces-common";

const markdownDescription = `
Follow these steps to get your Gamma API Key:

1.  Log in to your Gamma account. You must have a **Pro or Ultra plan** to access the API.
2.  Navigate to **Settings & Members** (click your workspace name in the top-left).
3.  Go to the **API Key** tab.
4.  Click **Create API key** and give it a name (e.g., "Activepieces").
5.  Copy the key (it starts with \`sk-gamma-\`) and paste it below.

**Direct Link to API Settings:** [**https://gamma.app/settings/api**](https://gamma.app/settings/api)
`;

export const gammaAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: "API Key",
      description: "Paste your API key here.",
      required: true,
    }),
  },
  async validate(auth) { 
    const apiKey = auth.auth.apiKey; 
    
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://public-api.gamma.app/v0.2/generations/1', 
        headers: {
          'X-API-KEY': apiKey, 
        },
      });
      return { valid: true };
    } catch (e) {
      if (e instanceof HttpError) {
        if (e.response.status === 404) {
          return { valid: true };
        }
        if (e.response.status === 401) {
          return { valid: false, error: 'Invalid API Key' };
        }
      }
      return { valid: false, error: 'Failed to connect to Gamma API' };
    }
  },
});