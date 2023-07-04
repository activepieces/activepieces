import { createPiece } from "@activepieces/pieces-framework";

import { newEmail } from "./lib/triggers/new-email";

export const imap = createPiece({
    displayName: "IMAP",
    logoUrl: "https://cdn.activepieces.com/pieces/imap.png",
    authors: ['MoShizzle'],
    actions: [],
    triggers: [newEmail],
});
