import { createPiece } from '@activepieces/pieces-framework';
import { crispAuth } from './lib/common/common';
import { addNote } from './lib/actions/addNote-to-conversation';
import { changeState } from './lib/actions/change-conversation-state';
import { findUserProfile } from './lib/actions/find-user-profile';
import { findConversation } from './lib/actions/find-conversation';
import { createUpdateContact } from './lib/actions/create-or-update-contact';
import { createConversation } from './lib/actions/create-new-conversation';
import { conversationStatusChanged } from './lib/triggers/conversation-status';
import { newContact } from './lib/triggers/new-contact';
import { newConversation} from './lib/triggers/new-conversation';


export const crisp = createPiece({
  displayName: 'Crisp',
  logoUrl: 'https://cdn.activepieces.com/pieces/crisp.png',
  auth: crispAuth,
  authors: [''],
  description: 'Crisp is a customer messaging platform that allows businesses to communicate with their customers through various channels such as live chat, email, and social media.',
  actions: [
    addNote,
    changeState,
    findUserProfile,
    findConversation,
    createUpdateContact,
    createConversation,
  ],
  triggers: [
    conversationStatusChanged,
    newContact,
    newConversation,
    ],
});