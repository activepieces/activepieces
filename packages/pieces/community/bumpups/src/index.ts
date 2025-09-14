import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendChat } from './lib/actions/send-chat';
import { generateCreatorHashtags } from './lib/actions/generate-creator-hashtags';
import { generateCreatorTitles } from './lib/actions/generate-creator-titles';
import { generateCreatorDescription } from './lib/actions/generate-creator-description';
import { generateCreatorTakeaways } from './lib/actions/generate-creator-takeaways';
import { generateTimestamps } from './lib/actions/generate-timestamps';

export const bumpupsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'Your Bumpups API key. You can find this in your Bumpups dashboard under API settings.',
  validate: async ({ auth }) => {
    if (!auth || auth.trim().length === 0) {
      return {
        valid: false,
        error: 'API key is required'
      };
    }
    
    if (auth.length < 10) {
      return {
        valid: false,
        error: 'API key appears to be too short'
      };
    }
    return {
      valid: true,
    };
  }
});

export const bumpups = createPiece({
  displayName: 'Bumpups',
  auth: bumpupsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bumpups.png',
  authors: [],
  actions: [sendChat, generateCreatorHashtags, generateCreatorTitles, generateCreatorDescription, generateCreatorTakeaways, generateTimestamps],
  triggers: [],
});
