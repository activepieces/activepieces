
    import { createPiece } from "@activepieces/pieces-framework";
    import { frontAuth } from '../src/lib/common/auth';
    import { createAccount } from '../src/lib/actions/create-account';
    import { updateAccount } from '../src/lib/actions/update-account';
    import { findAccount } from '../src/lib/actions/find-account';
    import { createContact } from '../src/lib/actions/create-contact';
    import { updateContact } from '../src/lib/actions/update-contact';
    import { findContact } from '../src/lib/actions/find-contact';
    import { addContactHandle } from '../src/lib/actions/add-contact-handle';
    import { removeContactHandle } from '../src/lib/actions/remove-contact-handle';
    import { sendMessage } from '../src/lib/actions/send-message';
    import { findConversation } from '../src/lib/actions/find-conversation';
    import { sendReply } from '../src/lib/actions/send-reply';
    import { updateConversation } from '../src/lib/actions/update-conversation';
    import { assignConversation } from '../src/lib/actions/assign-conversation';
    import { addConversationTags } from '../src/lib/actions/add-conversation-tags';
    import { removeConversationTags } from '../src/lib/actions/remove-conversation-tags';
    import { addComment } from '../src/lib/actions/add-comment';
    import { createDraft } from '../src/lib/actions/create-draft';
    import { createDraftReply } from '../src/lib/actions/create-draft-reply';
    import { createLink } from '../src/lib/actions/create-link';
    import { updateLink } from '../src/lib/actions/update-link';
    import { addConversationLinks } from '../src/lib/actions/add-conversation-links';
    import { removeConversationLinks } from '../src/lib/actions/remove-conversation-links';
    import { newComment } from '../src/lib/triggers/new-comment';
    import { newInboundMessage } from '../src/lib/triggers/new-inbound-message';
    import { newTagAdded } from '../src/lib/triggers/new-tag-added';
    import { newOutboundMessage } from '../src/lib/triggers/new-outbound-message';
    import { newConversationStateChange } from '../src/lib/triggers/new-conversation-state-change';

    export const front = createPiece({
      displayName: 'Front',
      auth: frontAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/front.png',
      authors: ['Prabhukiran161'],
      actions: [
        createAccount,
        updateAccount,
        findAccount,
        createContact,
        updateContact,
        findContact,
        addContactHandle,
        removeContactHandle,
        sendMessage,
        findConversation,
        sendReply,
        updateConversation,
        assignConversation,
        addConversationTags,
        removeConversationTags,
        addComment,
        createDraft,
        createDraftReply,
        createLink,
        updateLink,
        addConversationLinks,
        removeConversationLinks,
      ],
      triggers: [
        newComment,
        newInboundMessage,
        newTagAdded,
        newOutboundMessage,
        newConversationStateChange,
      ],
    });
    