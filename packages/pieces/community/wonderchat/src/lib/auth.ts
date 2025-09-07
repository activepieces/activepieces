import { PieceAuth } from '@activepieces/pieces-framework';

export const wonderchatAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Wonderchat API Key. Find it in the Wonderchat dashboard.',
  required: true,
});