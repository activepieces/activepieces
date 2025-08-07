import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";

const markdown = `
To authenticate your OneNote API connection:

1. Go to [Microsoft Entra admin center](https://entra.microsoft.com/)
2. Register a new application
3. Add the following permissions:
   - Notes.Read
   - Notes.ReadWrite
4. Get your Client ID and Client Secret
`;

export const onenoteApiAuth = PieceAuth.OAuth2({
    description: markdown,
    
    // Auth configuration
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: ["Notes.Read", "Notes.ReadWrite", "offline_access"],
    
    // Required properties
    props: {
        client_id: Property.ShortText({
            displayName: 'Client ID',
            description: 'Application (client) ID from your app registration',
            required: true,
        }),
        client_secret: PieceAuth.SecretText({
            displayName: 'Client Secret',
            description: 'Client secret from your app registration',
            required: true,
        }),
    }
});

export const onenoteApi = createPiece({
    displayName: "OneNote API",
    auth: onenoteApiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/onenote-api.png",
    authors: [],
    actions: [],
    triggers: [],
});
