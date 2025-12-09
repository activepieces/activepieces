import { PieceAuth } from "@activepieces/pieces-framework";


export const echowinAuth= PieceAuth.SecretText({
    displayName: "Echowin API Key",
    description: "API Key for Echowin",
    required: true,
});