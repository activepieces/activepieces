import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

import { askQuestion } from "./lib/actions/ask-question";
import { createSource } from "./lib/actions/create-source";
import { uploadSourceFile } from "./lib/actions/upload-source-file";
import { createBot } from "./lib/actions/create-bot";
import { findBot } from "./lib/actions/find-bot";

const markdown = `
To get your API key, follow these steps:
1. Log in to your DocsBot dashboard.
2. Navigate to the **API Keys** section.
3. Create a new API key if you don't have one.
4. Copy the API key. **Note:** The key is only shown once, so be sure to save it in a safe place.
`;

export const docsbotAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: markdown,
    required: true,
});

export const docsbot = createPiece({
    displayName: "Docsbot",
    auth: docsbotAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/docsbot.png",
    authors: [],
    actions: [
        askQuestion,
        createSource,
        uploadSourceFile,
        createBot,
        findBot,
    ],
    triggers: [],
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
});
