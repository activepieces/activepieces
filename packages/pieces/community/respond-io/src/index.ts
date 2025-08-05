import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Import actions
import { createContact } from './lib/actions/create-contact';
import { findContact } from './lib/actions/find-contact';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { deleteContact } from './lib/actions/delete-contact';
import { addTagToContact } from './lib/actions/add-tag-to-contact';
import { assignConversation } from './lib/actions/assign-conversation';
import { addCommentToConversation } from './lib/actions/add-comment-to-conversation';
import { openConversation } from './lib/actions/open-conversation';

// Import triggers
import { newIncomingMessage } from './lib/triggers/new-incoming-message';
import { newOutgoingMessage } from './lib/triggers/new-outgoing-message';
import { conversationOpened } from './lib/triggers/conversation-opened';
import { conversationClosed } from './lib/triggers/conversation-closed';
import { newContact } from './lib/triggers/new-contact';
import { contactUpdated } from './lib/triggers/contact-updated';
import { contactTagUpdated } from './lib/triggers/contact-tag-updated';

const markdown = `
To obtain your Respond.io API credentials:

1. Go to https://respond.io/
2. Sign up for a free trial account
3. Navigate to Settings > API
4. Generate an API key
5. Copy your Workspace ID from the URL or settings
`;

export const respondIoAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Respond.io API key',
      required: true,
    }),
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'Your Respond.io workspace ID',
      required: true,
    }),
  },
});

export const respondIo = createPiece({
  displayName: 'Respond.io',
  description: 'Business messaging platform for customer engagement',
  auth: respondIoAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/respondio.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['saurabh'],
  actions: [
    createContact,
    findContact,
    createOrUpdateContact,
    deleteContact,
    addTagToContact,
    assignConversation,
    addCommentToConversation,
    openConversation,
  ],
  triggers: [
    newIncomingMessage,
    newOutgoingMessage,
    conversationOpened,
    conversationClosed,
    newContact,
    contactUpdated,
    contactTagUpdated,
  ],
}); 