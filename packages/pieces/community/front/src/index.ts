
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { addComment } from "./lib/actions/add-comment";
import { addContactHandle } from "./lib/actions/add-contact-handle";
import { addConversationLinks } from "./lib/actions/add-conversation-links";
import { addConversationTags } from "./lib/actions/add-conversation-tags";
import { assignUnassignConversation } from "./lib/actions/assign-unassign-conversation";
import { createAccount } from "./lib/actions/remove-conversation-tags";
import { createContact } from "./lib/actions/create-contact";
import { createDraft } from "./lib/actions/create-draft";
import { createDraftReply } from "./lib/actions/create-draft-reply";
import { createLink } from "./lib/actions/create-link";
import { removeContactHandle } from "./lib/actions/remove-contact-handle";
import { removeConversationLinks } from "./lib/actions/remove-conversation-links";
import { sendMessage } from "./lib/actions/send-message";
import { sendReply } from "./lib/actions/send-reply";
import { updateAccount } from "./lib/actions/update-account";
import { updateContact } from "./lib/actions/update-contact";
import { updateConversation } from "./lib/actions/update-conversation";
import { updateLink } from "./lib/actions/update-link";
import { newComment } from "./lib/triggers/new-comment";
// import { newInboundMessage } from "./lib/triggers/new-inbound-message";
// import { newOutboundMessage } from "./lib/triggers/new-outbound-message";
// import { newTagAddedToMessage } from "./lib/triggers/new-tag-added-to-message";
import { findAccount } from "./lib/actions/find-account";
import { findContact } from "./lib/actions/find-contact";
import { findConversation } from "./lib/actions/find-conversation";
import { newConversationStateChange } from "./lib/triggers/new-conversation-state-change";
import { frontAuth } from "./lib/common/auth";

export const front = createPiece({
  displayName: "Front",
  auth: frontAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/front.png",
  authors: ['Niket2035'],
  actions: [
    addComment,
    addContactHandle,
    addConversationLinks,
    addConversationTags,
    assignUnassignConversation,
    createAccount,
    createContact,
    createDraft,
    createDraftReply,
    createLink,
    findAccount,
    findContact,
    findConversation,
    removeContactHandle,
    removeConversationLinks,
    removeContactHandle,
    sendMessage,
    sendReply,
    updateAccount,
    updateContact,
    updateConversation,
    updateLink
  ],
  triggers: [
    newComment,
    // newInboundMessage,
    // newOutboundMessage,
    // newTagAddedToMessage,
    newConversationStateChange
  ],
});
