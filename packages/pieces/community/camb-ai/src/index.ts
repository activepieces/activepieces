import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createTextToSound } from './lib/actions/create-text-to-sound';
import { createTextToSpeech } from './lib/actions/create-text-to-speech';
import { createTranslation } from './lib/actions/create-translation';
import { createTranscription } from './lib/actions/create-transcription';
import { createDubbing } from './lib/actions/create-dubbing';
import { createTextToSpeechAi } from './lib/actions/ai/create-text-to-speech-ai';
import { createTextToSoundAi } from './lib/actions/ai/create-text-to-sound-ai';
import { createTranslationAi } from './lib/actions/ai/create-translation-ai';
import { createTranscriptionAi } from './lib/actions/ai/create-transcription-ai';
import { createDubbingAi } from './lib/actions/ai/create-dubbing-ai';
import { listVoices } from './lib/actions/list-voices';
import { listSourceLanguages, listTargetLanguages } from './lib/actions/list-languages';
import { listFolders } from './lib/actions/list-folders';
import { createFolder } from './lib/actions/create-folder';
import { getTaskStatus } from './lib/actions/get-task-status';
import { getRunResult } from './lib/actions/get-run-result';
import { API_BASE_URL } from './lib/common';
import { cambaiAuth } from './lib/auth';

export const cambAi = createPiece({
    displayName: 'Camb.AI',
    auth: cambaiAuth,
    minimumSupportedRelease: '0.88.2',
    logoUrl: 'https://cdn.activepieces.com/pieces/camb-ai.png',
    authors: ['david-oluwaseun420', 'sanket-a11y'],
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    actions: [
        createTextToSound,
        createTextToSpeech,
        createTranslation,
        createTranscription,
        createDubbing,
        createTextToSpeechAi,
        createTextToSoundAi,
        createTranslationAi,
        createTranscriptionAi,
        createDubbingAi,
        listVoices,
        listSourceLanguages,
        listTargetLanguages,
        listFolders,
        createFolder,
        getTaskStatus,
        getRunResult,
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
