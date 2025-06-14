import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { createDeepgramClient } from "./client";

export const deepgramAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Deepgram API key',
  validate: async ({ auth }) => {
    try {
      const client = createDeepgramClient(auth);
      await client.get('/projects');
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API key: ' + (e as Error).message };
    }
  }
});