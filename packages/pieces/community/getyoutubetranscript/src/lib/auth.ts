import { PieceAuth } from '@activepieces/pieces-framework';
import { getYoutubeTranscriptRequest } from './common/client';

const markdownDescription = `
Sign up at [GetYouTubeTranscript](https://getyoutubetranscript.com) and create an API key in the [dashboard](https://getyoutubetranscript.com/dashboard). New accounts include free credits.
`;

export const getYoutubeTranscriptAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      // /credits costs no credits, so validating a key is free.
      await getYoutubeTranscriptRequest(auth, '/credits');
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key.' };
    }
  },
});
