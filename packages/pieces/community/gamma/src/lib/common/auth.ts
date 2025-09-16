import { PieceAuth } from "@activepieces/pieces-framework";
import { HttpError, HttpMethod, httpClient } from "@activepieces/pieces-common";

export const gammaAuth = PieceAuth.SecretText({
  displayName: "API Key",
  description: "Get your API key from your Gamma account settings. It starts with 'sk-gamma-'.",
  required: true,
  async validate(auth) { 
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://public-api.gamma.app/v0.2/generations/1', 
        headers: {
          'X-API-KEY': auth.auth,
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