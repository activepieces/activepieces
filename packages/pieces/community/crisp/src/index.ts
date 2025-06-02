import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createNewConversation } from './lib/actions/create-new-conversation';
import { changeConversationState } from './lib/actions/change-conversation-state';
import { findConversation } from './lib/actions/find-conversation';
import { findUserProfile } from './lib/actions/find-user-profile';

export const crispAuth = PieceAuth.CustomAuth({
  description: `
  1. Go to the Crisp Marketplace
  2. Sign in or create an account
  3. Go to Plugins and click on New Plugin
  4. Select Private plugin type
  5. Give your plugin a name and create it
  6. Go to Tokens and scroll to Production
  7. Click "Ask a production token" and select required scopes
  8. Once approved, copy your Production token keypair
  `,
  required: true,
  props: {
    identifier: Property.ShortText({
      displayName: 'Identifier',
      description: 'Your Crisp token identifier',
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'Key',
      description: 'Your Crisp token key',
      required: true,
    }),
  },
});

export const crisp = createPiece({
  displayName: 'Crisp',
  description:
    'Crisp is a customer messaging platform that helps you build better customer relationships.',
  auth: crispAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/crisp.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: [],
  actions: [
    createNewConversation,
    changeConversationState,
    findConversation,
    findUserProfile,
  ],
  triggers: [],
});
