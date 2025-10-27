import { PieceAuth } from "@activepieces/pieces-framework";

export const shippoAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Your Shippo API token',
  required: true,
  validate: async (auth) => {
    if (!auth.auth) {
      return { valid: false, error: 'API token is required' };
    }
    if (auth.auth.length < 10) {
      return { valid: false, error: 'Invalid API token format' };
    }
    return { valid: true };
  }
});