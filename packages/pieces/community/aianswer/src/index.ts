import {
  httpClient,
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { aiAnswerConfig } from './lib/common/models';
import { gmailGetListOfAgents } from './lib/actions/gmail-get-list-of-agents';
import { createPhoneCall } from './lib/actions/create-phone-call';
import { getCallDetails } from './lib/actions/get-call-details';
import { scheduleCallAgent } from './lib/actions/schedule-call-agent';
import { PieceCategory } from '@activepieces/shared';
import { getCallTranscript } from './lib/actions/get-call-transcript';

export const aiAnswerAuth = PieceAuth.SecretText({
  displayName: 'AiAnswer API Access Token',
  required: true,
  description: `
      To obtain your AiAnswer API access token, follow these steps below:
      1. Log in to your AiAnswer account at https://app.aianswer.us .
      2. Navigate to Settings < API Key.
      3. Click on Copy icon to copy your existing Key or click on New API Key to create a new one.
      4. Copy the API Key and paste it below in "AiAnswer API Key".
    `,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<string[]>({
        method: HttpMethod.GET,
        url: `${aiAnswerConfig.baseUrl}/gmail/list_agents`,
        headers: {
          [aiAnswerConfig.accessTokenHeaderKey]: auth.auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});

export const aianswer = createPiece({
  displayName: 'AI Answer',
  auth: aiAnswerAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/aianswer.png',
  categories: [
    PieceCategory.COMMUNICATION,
    PieceCategory.CUSTOMER_SUPPORT,
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
  ],
  authors: ['drona2938'],
  actions: [
    gmailGetListOfAgents,
    createPhoneCall,
    getCallDetails,
    scheduleCallAgent,
    getCallTranscript,
    createCustomApiCallAction({
      baseUrl: () => aiAnswerConfig.baseUrl,
      auth: aiAnswerAuth,
      authMapping: async (auth) => ({
        [aiAnswerConfig.accessTokenHeaderKey]: `${auth}`,
      }),
    }),
  ],
  triggers: [],
});
