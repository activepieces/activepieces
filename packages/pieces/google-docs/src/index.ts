import { PieceAuth, createPiece } from "@activepieces/pieces-framework";

import { createDocument } from "./lib/actions/create-document";

export const googleDocsAuth = PieceAuth.OAuth2({
    
    authUrl: "https://accounts.google.com/o/oauth2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    required: true,
    scope: ["https://www.googleapis.com/auth/documents"]
})

export const googleDocs = createPiece({
    displayName: "Google Docs",
        minimumSupportedRelease: '0.5.0',
    logoUrl: "https://cdn.activepieces.com/pieces/google-docs.png",
    authors: ['MoShizzle'],
    auth: googleDocsAuth,
    actions: [createDocument],
    triggers: [],
});
