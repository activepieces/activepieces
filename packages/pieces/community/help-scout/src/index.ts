import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { helpScoutAuth } from './lib/auth';

// Actions
import { createConversation } from './lib/actions/create-conversation';
import { sendReply } from './lib/actions/send-reply';
import { addNote } from './lib/actions/add-note';
import { createCustomer } from './lib/actions/create-customer';
import { updateCustomer } from './lib/actions/update-customer';
import { findConversation } from './lib/actions/find-conversation';
import { findCustomer } from './lib/actions/find-customer';
import { findUser } from './lib/actions/find-user';
import { customApiCall } from './lib/actions/custom-api-call';

// Triggers
import { conversationCreated } from './lib/triggers/conversation-created';
import { conversationAssigned } from './lib/triggers/conversation-assigned';
import { tagsUpdated } from './lib/triggers/tags-updated';
import { newCustomer } from './lib/triggers/new-customer';

export const helpScout = createPiece({
  displayName: 'Help Scout',
  description: 'Customer support platform for managing email conversations, tickets, and customer interactions',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/help-scout.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  authors: ['activepieces'],
  auth: helpScoutAuth,
  actions: [
    // Write Actions
    createConversation,
    sendReply,
    addNote,
    createCustomer,
    updateCustomer,
    
    // Search Actions
    findConversation,
    findCustomer,
    findUser,
    
    // Custom API Call
    customApiCall,
  ],
  triggers: [
    conversationCreated,
    conversationAssigned,
    tagsUpdated,
    newCustomer,
  ],
});