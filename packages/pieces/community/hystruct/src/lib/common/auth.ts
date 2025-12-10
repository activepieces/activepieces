import { PieceAuth } from "@activepieces/pieces-framework";

export const hystructAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'API Key for Hystruct',
    required: true,
});