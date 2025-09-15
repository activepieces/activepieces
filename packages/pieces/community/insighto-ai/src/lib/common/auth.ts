import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const InsightoAuth = PieceAuth.SecretText({
  displayName: 'Insighto.ai API Key',
  description: `**Enter your Insighto.ai API Key**
---
### How to obtain your API key
1. Log in to [Insighto.ai](https://insighto.ai).
2. Go to **Settings** > **API Keys**.
3. Generate a new API key (keys start with \`in-\`).
4. Copy and paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        // Use a simple GET request to validate API key
        await makeRequest(auth as string, HttpMethod.GET, '/contact');
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid API Key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid API Key',
    };
  },
});
