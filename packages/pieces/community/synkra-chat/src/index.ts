import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { synkraChatAuth } from './lib/auth';

import { sendMessageAction } from './lib/actions/send-message.action';
import { createContactAction } from './lib/actions/create-contact.action';
import { findContactAction } from './lib/actions/find-contact.action';
import { getContactAction } from './lib/actions/get-contact.action';
import { updateContactAction } from './lib/actions/update-contact.action';
import { tagContactAction } from './lib/actions/tag-contact.action';
import { createConversationAction } from './lib/actions/create-conversation.action';
import { getConversationAction } from './lib/actions/get-conversation.action';
import { toggleConversationStatusAction } from './lib/actions/toggle-conversation-status.action';
import { assignConversationAction } from './lib/actions/assign-conversation.action';
import { tagConversationAction } from './lib/actions/tag-conversation.action';
import { createLabelAction } from './lib/actions/create-label.action';
import { createTeamAction } from './lib/actions/create-team.action';

import { newMessageTrigger } from './lib/triggers/new-message.trigger';
import { newConversationTrigger } from './lib/triggers/new-conversation.trigger';
import { newContactTrigger } from './lib/triggers/new-contact.trigger';

export const synkraChat = createPiece({
  displayName: 'Synkra Chat',
  description:
    'Connect Synkra Chat to your automations. Send messages, create contacts, route conversations, and react to events in real time.',
  minimumSupportedRelease: '0.92.0',
  logoUrl: 'https://flow.synkra.co.za/logo-192.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.CUSTOMER_SUPPORT],
  auth: synkraChatAuth,
  authors: ['synkra'],
  actions: [
    sendMessageAction,
    createContactAction,
    findContactAction,
    getContactAction,
    updateContactAction,
    tagContactAction,
    createConversationAction,
    getConversationAction,
    toggleConversationStatusAction,
    assignConversationAction,
    tagConversationAction,
    createLabelAction,
    createTeamAction,
  ],
  triggers: [
    newMessageTrigger,
    newConversationTrigger,
    newContactTrigger,
  ],
});
