
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

export const front = createPiece({
  displayName: "Front",
  auth: PieceAuth.None(),
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
  triggers: [],
});
