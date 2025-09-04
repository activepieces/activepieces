import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { createPiece } from "@activepieces/pieces-framework";
import { wonderchatAuth } from "./lib/common/auth";



export const wonderchat = createPiece({
    displayName: "Wonderchat",
    // Use the authentication defined in the auth.ts file.
    auth: wonderchatAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/wonderchat.png",
    authors: [],
    // Register the "Chat with Chatbot" action. More actions can be added here.
    actions: [],
    triggers: [],
});