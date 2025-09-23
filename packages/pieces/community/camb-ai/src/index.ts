import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { createTextToSound } from "./lib/actions/create-text-to-sound";
import { createTextToSpeech } from "./lib/actions/create-text-to-speech";
import { createTranslation } from "./lib/actions/create-translation";
import { createTranscription } from "./lib/actions/create-transcription"; 

export const cambaiAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: `
    To get your API key, please follow these steps:
    1. Log in to your [CAMB.AI Studio](https://camb.ai/studio/) account.
    2. Navigate to your workspace's API Keys dashboard.
    3. Create a new key if you haven't already.
    4. Copy the API key and paste it here.
    `,
    required: true,
});

export const cambAi = createPiece({
    displayName: "Camb.ai",
    auth: cambaiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/camb-ai.png",
    authors: [],
    actions: [
        createTextToSound,
        createTextToSpeech,
        createTranslation,
        createTranscription 
    ],
    triggers: [],
});