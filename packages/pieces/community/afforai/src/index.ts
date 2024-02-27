import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { askChatbotAction } from './lib/actions/ask-chatbot';

export const afforaiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
  To obtain your API Key, follow these steps:
  1. Log in to your Afforai account.
  2. Navigate to **API** section on left panel.
  3. On the top-right, you can find you API key.
  `,
});
export const afforai = createPiece({
  displayName: 'Afforai',
  auth: afforaiAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/afforai.png',
  authors: ['kishanprmr'],
  actions: [askChatbotAction],
  triggers: [],
});
