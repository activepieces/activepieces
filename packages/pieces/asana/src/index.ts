import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { asanaCreateTaskAction } from "./lib/actions/create-task";

export const asanaAuth = PieceAuth.OAuth2({
    displayName: '',
    description: "",
    authUrl: "https://app.asana.com/-/oauth_authorize",
    tokenUrl: "https://app.asana.com/-/oauth_token",
    required: true,
    scope: ['default'],
});

export const asana = createPiece({
    displayName: "Asana",
    logoUrl: 'https://cdn.activepieces.com/pieces/asana.png',
    authors: ['abuaboud'],
    auth: asanaAuth,
    actions: [
        asanaCreateTaskAction,
    ],
    triggers: [],
});
