import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { createPiece } from "@activepieces/pieces-framework";
import { wonderchatAuth } from "./lib/common/auth";

import { askQuestion } from "./lib/actions/ask-question";
import { addPage } from "./lib/actions/add-page";
import { addTag } from "./lib/actions/add-tag";
import { removeTag } from "./lib/actions/remove-tag";

import { newUserMessage } from "./lib/triggers/new-user-message";


export const wonderchat = createPiece({
    displayName: "Wonderchat",
    // Use the authentication defined in the auth.ts file.
    auth: wonderchatAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/wonderchat.png",
    authors: [],
    // Register the "Chat with Chatbot" action. More actions can be added here.
    actions: [
        askQuestion,
        addPage,
        addTag,
        removeTag,
    ],
    triggers: [
        newUserMessage,
    ],
});