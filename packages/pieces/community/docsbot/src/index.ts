import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

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
    actions: [],
    triggers: [],
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
});
