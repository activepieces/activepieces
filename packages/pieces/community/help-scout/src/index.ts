import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { helpScoutAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/api';
import { createConversation } from './lib/actions/create-conversation';
import { sendReply } from './lib/actions/send-reply';
import { addNote } from './lib/actions/add-note';
import { createCustomer } from './lib/actions/create-customer';
import { updateCustomerProperties } from './lib/actions/update-customer-properties';
import { findConversation } from './lib/actions/find-conversation';
import { findCustomer } from './lib/actions/find-customer';
import { findUser } from './lib/actions/find-user';
import { aiCreateConversation } from './lib/actions/ai/create-conversation';
import { aiSendReply } from './lib/actions/ai/send-reply';
import { aiAddNote } from './lib/actions/ai/add-note';
import { aiUpdateCustomerProperties } from './lib/actions/ai/update-customer-properties';
import { searchConversations } from './lib/actions/ai/search-conversations';
import { getConversation } from './lib/actions/ai/get-conversation';
import { listConversationThreads } from './lib/actions/ai/list-conversation-threads';
import { updateConversation } from './lib/actions/ai/update-conversation';
import { updateConversationTags } from './lib/actions/ai/update-conversation-tags';
import { deleteConversation } from './lib/actions/ai/delete-conversation';
import { listMailboxes } from './lib/actions/ai/list-mailboxes';
import { listUsers } from './lib/actions/ai/list-users';
import { listTags } from './lib/actions/ai/list-tags';
import { getCustomer } from './lib/actions/ai/get-customer';
import { listCustomerProperties } from './lib/actions/ai/list-customer-properties';
import { conversationCreated } from './lib/triggers/conversation-created';
import { conversationAssigned } from './lib/triggers/conversation-assigned';
import { newCustomer } from './lib/triggers/new-customer';
import { tagsUpdated } from './lib/triggers/tags-updated';

export const helpScout = createPiece({
  displayName: 'Help Scout',
  auth: helpScoutAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/help-scout.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  authors: ['sparkybug', 'OdaiAhmed99'],
  actions: [
    createConversation,
    sendReply,
    addNote,
    createCustomer,
    updateCustomerProperties,
    findConversation,
    findCustomer,
    findUser,
    aiCreateConversation,
    aiSendReply,
    aiAddNote,
    aiUpdateCustomerProperties,
    searchConversations,
    getConversation,
    listConversationThreads,
    updateConversation,
    updateConversationTags,
    deleteConversation,
    listMailboxes,
    listUsers,
    listTags,
    getCustomer,
    listCustomerProperties,
    createCustomApiCallAction({
      auth: helpScoutAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [conversationCreated, conversationAssigned, newCustomer, tagsUpdated],
});
