import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { callClassifierModel } from "./lib/actions/call-classifier-model";

export const clarifaiAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: "Obtain an API or PAT key from your Clarifai account",
    required: true,
});

export const clarifai = createPiece({
    displayName: "Clarifai",
    minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/clarifai.png',
    authors: ['akatechis'],
    auth: clarifaiAuth,
    actions: [
        callClassifierModel,
    ],
    triggers: [],
});
