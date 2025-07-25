
    import { createPiece } from "@activepieces/pieces-framework";
    import { helpScoutAuth } from "./lib/common/auth";
    // Actions
    import { createConversation } from './lib/actions/create-conversation';
    import { sendReply } from './lib/actions/send-reply';
    import { addNote } from './lib/actions/add-note';
    import { createCustomer } from './lib/actions/create-customer';
    import { updateCustomerProperties } from './lib/actions/update-customer-properties';
    import { findConversation } from './lib/actions/find-conversation';
    import { findCustomer } from './lib/actions/find-customer';
    import { findUser } from './lib/actions/find-user';
    // Triggers
    import { conversationCreated } from './lib/triggers/conversation-created';
    import { conversationAssigned } from './lib/triggers/conversation-assigned';
    import { tagsUpdated } from './lib/triggers/tags-updated';
    import { newCustomer } from './lib/triggers/new-customer';

    export const helpScout = createPiece({
      displayName: "Help Scout",
      auth: helpScoutAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/help-scout.png",
      authors: [],
      actions: [
        createConversation,
        sendReply,
        addNote,
        createCustomer,
        updateCustomerProperties,
        findConversation,
        findCustomer,
        findUser,
      ],
      triggers: [
        conversationCreated,
        conversationAssigned,
        tagsUpdated,
        newCustomer,
      ],
    });
    