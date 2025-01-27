import {
  createPiece,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { makeCallAction } from './lib/actions/make-call';
import { getCallDetailsAction } from './lib/actions/get-call-details';

const authDescription = `
Follow these steps to obtain your Kallbot API Key:

1. Go to [Kallabot](https://kallabot.com/) and log in to your account.
2. Click on your profile picture in the top right corner.
3. Select **Settings** from the dropdown menu.
4. Navigate to the **API & Integrations** tab.
5. Copy the generated API key and paste it here.
`;

export const kallabotAuth = PieceAuth.SecretText({
  description: authDescription,
  displayName: 'API Key',
  required: true
});

export const kallabotAi = createPiece({
  displayName: 'Kallabot',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/kallabot-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['abdulrahmanmajid'],
  auth: kallabotAuth,
  actions: [makeCallAction, getCallDetailsAction],
  triggers: [],
  description: 'AI-powered voice agents and conversational interfaces.',
});
