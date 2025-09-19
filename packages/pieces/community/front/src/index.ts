import { createPiece } from "@activepieces/pieces-framework";
import { addComment } from "./lib/actions/add-comment";
import { addContactHandle } from "./lib/actions/add-contact-handle";
import { addConversationLinks } from "./lib/actions/add-conversation-links";
import { assignConversation } from "./lib/actions/assign-conversation";
import { createAccount } from "./lib/actions/create-account";
import { createDraftReply } from "./lib/actions/create-draft-reply";
import { createDraft } from "./lib/actions/create-draft";
import { createLink } from "./lib/actions/create-link";
import { findContact } from "./lib/actions/find-contact";
import { findAccount } from "./lib/actions/find-account";
import { findConversation } from "./lib/actions/find-conversation";
import { removeConversationTags } from "./lib/actions/remove-conversation-tags";
import { removeContactHandle } from "./lib/actions/remove-contact-handle";
import { removeConversationLinks } from "./lib/actions/remove-conversation-links";
import { sendMessage } from "./lib/actions/send-message";
import { sendReply } from "./lib/actions/send-reply";
import { unassignConversation } from "./lib/actions/unassign-conversation";
import { updateAccount } from "./lib/actions/update-account";
import { updateContact } from "./lib/actions/update-contact";
import { updateConversation } from "./lib/actions/update-conversation";
import { updateLink } from "./lib/actions/update-link";
import { newComment } from "./lib/triggers/new-comment";
import { newTagAddedToMessage } from "./lib/triggers/new-tag-added-to-message";
import { newInboundMessage } from "./lib/triggers/new-inbound-message";
import { newOutboundMessage } from "./lib/triggers/new-outbound-message";
import { newConversationStateChange } from "./lib/triggers/new-conversation-state-change";
import { addConversationTags } from "./lib/actions/add-conversation-tags";
import { createContact } from "./lib/actions/create-contact";
import { frontAuth } from "./lib/common/auth";

export const front = createPiece({
    displayName: "Front",
    auth: frontAuth,
    minimumSupportedRelease: "0.36.1",
    logoUrl: "https://cdn.activepieces.com/pieces/front.png",
    authors: ["CorrM"],
    actions: [
        addComment,
        addContactHandle,
        addConversationLinks,
        addConversationTags,
        assignConversation,
        unassignConversation,
        createAccount,
        createContact,
        createDraftReply,
        createDraft,
        createLink,
        findAccount,
        findContact,
        findConversation,
        removeContactHandle,
        removeConversationLinks,
        removeConversationTags,
        sendMessage,
        sendReply,
        updateAccount,
        updateContact,
        updateConversation,
        updateLink,
    ],
    triggers: [newComment, newInboundMessage, newOutboundMessage, newConversationStateChange, newTagAddedToMessage],
});
