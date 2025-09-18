import { createPiece } from "@activepieces/pieces-framework";
import { frontAuth } from "./lib/common/auth";


import { newComment } from "./lib/triggers/new-comment";
import { newInboundMessage } from "./lib/triggers/new-inbound-message";
import { newOutboundMessage } from "./lib/triggers/new-outbound-message";
import { newTagAdded } from "./lib/triggers/new-tag-added";
import { newConversationStateChange } from "./lib/triggers/new-conversation-state-change";


import { addContactHandle } from "./lib/actions/add-contact-handle";
import { removeContactHandle } from "./lib/actions/remove-contact-handle";
import { addConversationTags } from "./lib/actions/add-conversation-tags";
import { removeConversationTags } from "./lib/actions/remove-conversation-tags";
import { createAccount } from "./lib/actions/create-account";
import { updateAccount } from "./lib/actions/update-account";
import { createContact } from "./lib/actions/create-contact";
import { updateContact } from "./lib/actions/update-contact";
import { sendReply } from './lib/actions/send-reply';
import { createDraft } from "./lib/actions/create-draft";
import { createLink } from "./lib/actions/create-link";
import { updateLink } from "./lib/actions/update-link";
import { assignConversation } from "./lib/actions/assign-conversation";
import { updateConversation } from "./lib/actions/update-conversation";
import { addComment } from "./lib/actions/add-comment";
import { addConversationLinks } from "./lib/actions/add-conversation-links";
import { removeConversationLinks } from "./lib/actions/remove-conversation-links";
import { sendMessage } from "./lib/actions/send-message";
import { createDraftReply } from "./lib/actions/create-draft-reply";
import { findContact } from "./lib/actions/find-contact";
import { findConversation } from "./lib/actions/find-conversation";
import { findAccount } from "./lib/actions/find-account";

export const front = createPiece({
  displayName: "Front",
  auth: frontAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/front.png",
  authors: ['Your-GitHub-Username'],
  actions: [
    addContactHandle,
    removeContactHandle,
    addConversationTags,
    removeConversationTags,
    createAccount,
    updateAccount,
    createContact,
    updateContact,
    sendReply,
    createDraft,
    createLink,
    updateLink,
    assignConversation,
    updateConversation,
    addComment,
    addConversationLinks,
    removeConversationLinks,
    sendMessage,
    createDraftReply, 
    findContact,
    findConversation,
    findAccount,
  ],
  triggers: [
    newComment,
    newInboundMessage,
    newOutboundMessage,
    newTagAdded,
    newConversationStateChange,
  ],
});