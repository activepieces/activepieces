import { createPiece } from "@activepieces/pieces-framework";

import { createDocument } from "./lib/actions/create-document";

export const googleDocs = createPiece({
    displayName: "Google Docs",
    logoUrl: "https://cdn.activepieces.com/pieces/google-docs.png",
    authors: ['MoShizzle'],
    actions: [createDocument],
    triggers: [],
});
