import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { helpScoutAuth } from './lib/common/auth';
import { createConversation } from './lib/actions/create-conversation';
import { sendReply } from './lib/actions/send-reply';
import { addNote } from './lib/actions/add-note';
import { createCustomer } from './lib/actions/create-customer';
import { findConversation } from './lib/actions/find-conversation';
import { findCustomer } from './lib/actions/find-customer';
import { findUser } from './lib/actions/find-user';
import { conversationCreated } from './lib/triggers/conversation-created';
import { conversationAssigned } from './lib/triggers/conversation-assigned';
import { newCustomer } from './lib/triggers/new-customer';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/api';
import { updateCustomerProperties } from './lib/actions/update-customer-properties';
import { tagsUpdated } from './lib/triggers/tags-updated';
import { PieceCategory } from '@activepieces/shared';

export const helpScout = createPiece({
  displayName: 'Help Scout',
  auth: helpScoutAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/help-scout.png',
  categories:[PieceCategory.CUSTOMER_SUPPORT],
  authors: ['sparkybug'],
  actions: [
    createConversation,
    sendReply,
    addNote,
    createCustomer,
    updateCustomerProperties,
    findConversation,
    findCustomer,
    findUser,
    createCustomApiCallAction({
      auth: helpScoutAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [conversationCreated, conversationAssigned, newCustomer,tagsUpdated],
});
