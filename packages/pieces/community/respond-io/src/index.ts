import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { respondIoAuth } from './lib/common/auth';
import { addCommentToConversation } from './lib/actions/add-comment-to-conversation';
import { addTagToContact } from './lib/actions/add-tag-to-contact';
import { assignOrUnassignConversation } from './lib/actions/assign-or-unassign-conversation';
import { createContact } from './lib/actions/create-contact';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { deleteContact } from './lib/actions/delete-contact';
import { findContact } from './lib/actions/find-contact';
import { openConversation } from './lib/actions/open-conversation';
import { contactTagUpdatedTrigger } from './lib/triggers/contact-tag-updated';
import { contactUpdatedTrigger } from './lib/triggers/contact-updated';
import { conversationClosedTrigger } from './lib/triggers/conversation-closed';
import { conversationOpenedTrigger } from './lib/triggers/conversation-opened';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newIncomingMessageTrigger } from './lib/triggers/new-incoming-message';
import { newOutgoingMessageTrigger } from './lib/triggers/new-outgoing-message';

export const respondIo = createPiece({
  displayName: 'Respond.io',
  auth: respondIoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/respond-io.png',
  authors: ['aryel780'],
  actions: [
    addCommentToConversation,
    addTagToContact,
    assignOrUnassignConversation,
    createContact,
    createOrUpdateContact,
    deleteContact,
    findContact,
    openConversation,
    createCustomApiCallAction({
      auth: respondIoAuth,
      baseUrl: () => 'https://api.respond.io/v2',
      authMapping: async (auth: unknown) => {
        const { token } = auth as { token: string };
        return {
          Authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
  triggers: [
    contactTagUpdatedTrigger,
    contactUpdatedTrigger,
    conversationClosedTrigger,
    conversationOpenedTrigger,
    newContactTrigger,
    newIncomingMessageTrigger,
    newOutgoingMessageTrigger,
  ],
});
