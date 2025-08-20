import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { retellAiCommon } from './lib/common';
import { createPhoneCallAction } from './lib/actions/create-phone-call';
import { createPhoneNumberAction } from './lib/actions/create-phone-number';
import { getCallAction } from './lib/actions/get-call';
import { getPhoneNumberAction } from './lib/actions/get-phone-number';
import { getVoiceAction } from './lib/actions/get-voice';
import { getAgentAction } from './lib/actions/get-agent';
import { newCallTrigger } from './lib/triggers/new-call-trigger';

// Markdown for the API key connection
const markdown = `
To obtain your API Key, follow these steps:

1. Log in to your [Retell AI Dashboard](https://retellai.com/dashboard).
2. Navigate to the **API Keys** section from the left-hand menu.
3. Click **Create a new key**.
4. Copy the generated API Key.
`;

// Define the authentication property for Retell AI
export const retellAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdown,
  required: true,
  validate: async ({ auth }) => {
    // A simple validation to check if the key is not empty.
    // You could expand this to make a test API call if Retell AI has a "whoami" endpoint.
    if (auth && auth.length > 0) {
      return {
        valid: true,
      };
    }
    return {
      valid: false,
      error: 'API Key is required.',
    };
  },
});

export const retellAi = createPiece({
  displayName: 'Retell AI',
  description: 'Build and integrate conversational voice AI agents',
  auth: retellAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/retell-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['your-github-username'], // TODO: Add your github username
  actions: [
    
    createPhoneCallAction,
    createPhoneNumberAction,
    getCallAction,
    getPhoneNumberAction,
    getVoiceAction,
    getAgentAction,
    createCustomApiCallAction({
      baseUrl: () => retellAiCommon.baseUrl,
      auth: retellAiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth as string}`,
      }),
    }),
    // TODO: Add specific actions here (e.g., createAgent, startCall)
  ],
  triggers: [
    newCallTrigger,
    // TODO: Add triggers here
  ],
});
