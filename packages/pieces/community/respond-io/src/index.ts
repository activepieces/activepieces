import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Auth
import { respondIoAuth } from './lib/common/auth';

// Actions
import { findContactAction } from './lib/actions/find-contact';
import { createContactAction } from './lib/actions/create-contact';
import { createOrUpdateContactAction } from './lib/actions/create-or-update-contact';
import { deleteContactAction } from './lib/actions/delete-contact';
import { addTagToContactAction } from './lib/actions/add-tag-to-contact';
import { assignConversationAction } from './lib/actions/assign-conversation';
import { addCommentToConversationAction } from './lib/actions/add-comment-to-conversation';
import { openConversationAction } from './lib/actions/open-conversation';

// Triggers
import { newIncomingMessageTrigger } from './lib/triggers/new-incoming-message';
import { newOutgoingMessageTrigger } from './lib/triggers/new-outgoing-message';
import { conversationOpenedTrigger } from './lib/triggers/conversation-opened';
import { conversationClosedTrigger } from './lib/triggers/conversation-closed';
import { newContactTrigger } from './lib/triggers/new-contact';
import { contactUpdatedTrigger } from './lib/triggers/contact-updated';
import { contactTagUpdatedTrigger } from './lib/triggers/contact-tag-updated';

const markdownDescription = `
Respond.io is a business messaging platform that enables automated conversations and customer engagement across SMS, WhatsApp, Messenger, and more.

## Authentication

To get your API Access Token:

1. Log in to your Respond.io account
2. Go to **Settings** > **API Access**
3. Click **Generate API Access Token**
4. Copy the token and paste it here

## Features

### Search Actions
- **Find Contact** - Search for contacts by phone, email, or ID

### Write Actions
- **Create Contact** - Create a new contact record
- **Create or Update Contact** - Upsert contact by email/phone or ID
- **Delete Contact** - Permanently delete a contact
- **Add Tag to Contact** - Assign tags to contacts for organization
- **Assign or Unassign Conversation** - Manage conversation assignments
- **Open Conversation** - Mark conversations as open for handling

### Triggers
- **New Incoming Message** - Fires when a message is received
- **New Outgoing Message** - Fires when a message is sent
- **Conversation Opened** - Fires when a conversation is opened
- **Conversation Closed** - Fires when a conversation is closed
- **New Contact** - Fires when a contact is created
- **Contact Updated** - Fires when contact fields are updated
- **Contact Tag Updated** - Fires when contact tags are modified

For more information, visit the [Respond.io API documentation](https://developers.respond.io/).
`;

export const respondIo = createPiece({
  displayName: 'Respond.io',
  description: 'Business messaging platform for automated conversations across multiple channels',
  auth: respondIoAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/respond-io.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.CUSTOMER_SUPPORT],
  authors: ['activepieces'],
  actions: [
    // Search Actions
    findContactAction,
    
    // Write Actions
    createContactAction,
    createOrUpdateContactAction,
    deleteContactAction,
    addTagToContactAction,
    assignConversationAction,
    addCommentToConversationAction,
    openConversationAction,
    
    // Custom API Call
    createCustomApiCallAction({
      baseUrl: () => 'https://api.respond.io/v2',
      auth: respondIoAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [
    newIncomingMessageTrigger,
    newOutgoingMessageTrigger,
    conversationOpenedTrigger,
    conversationClosedTrigger,
    newContactTrigger,
    contactUpdatedTrigger,
    contactTagUpdatedTrigger,
  ],
});
