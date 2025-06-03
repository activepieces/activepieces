import { PieceAuth } from '@activepieces/pieces-framework';
import { createDeepgramClient } from './client';

const markdownDescription = `
Follow these instructions to get your API Key:

1. Visit [Deepgram Console](https://console.deepgram.com/)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Create a new API key or copy an existing one
5. Paste the API key below

Your API key should start with a string of characters and numbers.
`;

export const deepgramAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'The Deepgram API key is required.',
      };
    }

    try {
      const client = createDeepgramClient(auth);
      await client.get('/projects');
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'The Deepgram API key is invalid or there was an error connecting to Deepgram.',
      };
    }
  },
});
