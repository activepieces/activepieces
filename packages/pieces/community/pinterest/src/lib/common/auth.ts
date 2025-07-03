import { HttpMethod } from "@activepieces/pieces-common";
import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from ".";

export const cognitoFormsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
  `,
  validate: async ({ auth }) => {
    try {
      await makeRequest(auth as string, HttpMethod.GET, '/forms');
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});
