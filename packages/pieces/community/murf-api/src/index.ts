import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { textToSpeech } from './lib/actions/text-to-speech';
import { translateText } from './lib/actions/translate-text';
import { createProject } from './lib/actions/create-project';
import { listVoices } from './lib/actions/list-voices';

const MURF_API_URL = 'https://api.murf.ai/v1';


export const murfAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Please enter your Murf API key. You can find this in your Murf account settings.',
    required: true,
    validate: async ({ auth }) => {
        try {
           
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${MURF_API_URL}/auth/token`,
                headers: {
                    'api-key': auth,
                },
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API Key.',
            };
        }
    },
});

export const murfApi = createPiece({
    displayName: "Murf AI",
    auth: murfAuth, 
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/murf-api.png",
    authors: [
    ],
    actions: [
        textToSpeech,
        translateText,
        createProject,
        listVoices,
        
    ],
    triggers: [
    ],
});