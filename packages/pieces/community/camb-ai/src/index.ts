import { createPiece } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { createTextToSound } from "./lib/actions/create-text-to-sound";
import { createTextToSpeech } from "./lib/actions/create-text-to-speech";
import { createTranslation } from "./lib/actions/create-translation";
import { createTranscription } from "./lib/actions/create-transcription";
import { createTranslatedTts } from "./lib/actions/create-translated-tts";
import { createDubbing } from "./lib/actions/create-dubbing";
import { cloneVoice } from "./lib/actions/clone-voice";
import { listVoices } from "./lib/actions/list-voices";
import { createTextToVoice } from "./lib/actions/create-text-to-voice";
import { separateAudio } from "./lib/actions/separate-audio";
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
        createTranslatedTts,
        createDubbing,
        cloneVoice,
        listVoices,
        createTextToVoice,
        separateAudio,
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