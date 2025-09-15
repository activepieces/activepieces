import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { askQuestion } from './lib/actions/ask-question';
import { addPage } from './lib/actions/add-page';
import { addTag } from './lib/actions/add-tag';
import { removeTag } from './lib/actions/remove-tag';
import { newUserMessage } from './lib/triggers/new-user-message';

export const wonderchatAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
  1. Log in to your Wonderchat account.
  2. Click on your **Profile card**.
  2. Go to your **User settings**.
  3. Click on the the **API keys** tab.
  3. If you already have a key, copy it, if not generate one.
  `,
  required: true,
});

export const wonderchat = createPiece({
  displayName: 'Wonderchat',
  description:
    'Wonderchat is a no-code chatbot platform that lets you deploy AI-powered chatbots for websites quickly.',
  auth: wonderchatAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wonderchat.png',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
  ],
  authors: ['devroy10', 'sanket-a11y'],
  actions: [askQuestion, addPage, addTag, removeTag],
  triggers: [newUserMessage],
});
