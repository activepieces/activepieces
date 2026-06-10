import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { createCustomApiCallAction, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { createTextToSound } from "./lib/actions/create-text-to-sound";
import { createTextToSpeech } from "./lib/actions/create-text-to-speech";
import { createTranslation } from "./lib/actions/create-translation";
import { createTranscription } from "./lib/actions/create-transcription";
import { API_BASE_URL } from "./lib/common";
import { PieceCategory } from "@activepieces/shared";
import { cambaiAuth } from './lib/auth';

export const cambAi = createPiece({
    displayName: "Camb.AI",
    auth: cambaiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/camb-ai.png",
    authors: ['david-oluwaseun420','sanket-a11y'], 
    categories:[PieceCategory.ARTIFICIAL_INTELLIGENCE],
    actions: [
        createTextToSound,
        createTextToSpeech,
        createTranslation,
        createTranscription,
        createCustomApiCallAction({
            auth: cambaiAuth,
            baseUrl: () => API_BASE_URL,
            authMapping: async (auth) => {
                return {
                    'x-api-key': auth.secret_text,
                };
            },
        }),
    ],
    triggers: [],
});