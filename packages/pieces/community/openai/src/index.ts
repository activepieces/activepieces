import {
  HttpMethod,
  createCustomApiCallAction,
  httpClient
} from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { askAssistant } from './lib/actions/ask-assistant';
import { generateImage } from './lib/actions/generate-image';
import { askOpenAI } from './lib/actions/send-prompt';
import { textToSpeech } from './lib/actions/text-to-speech';
import { transcribeAction } from './lib/actions/transcriptions';
import { translateAction } from './lib/actions/translation';
import { visionPrompt } from './lib/actions/vision-prompt';

const markdownDescription = `
Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`;

export const openaiAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdownDescription,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the OpenAI instance.',
      defaultValue: 'https://api.openai.com/v1',
      required: true,
    }),
    apiVersion: Property.ShortText({
      displayName: 'API Version',
      description: 'The API version if you are using an Azure OpenAI resource',
      required: false,
    }),
  },
  validate: async (auth) => {
    try {
      
      let headers;
      if (auth.auth.apiVersion) {
        headers = {
          'api-key': auth.auth.apiKey,
        };
      } else {
        headers = {
          Authorization: `Bearer ${auth.auth.apiKey}`,
        };
      }
      const baseUrl = auth.auth.baseUrl.replace(/\/$/, '') ?? 'https://api.openai.com/v1';
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: `${baseUrl}/models`,
        method: HttpMethod.GET,
        headers,
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});

export const openai = createPiece({
  displayName: 'OpenAI',
  description: 'Use the many tools ChatGPT has to offer.',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: openaiAuth,
  actions: [
    askOpenAI,
    askAssistant,
    generateImage,
    visionPrompt,
    textToSpeech,
    transcribeAction,
    translateAction,
    createCustomApiCallAction({
      auth: openaiAuth,
      baseUrl: (auth) => {
        const typedAuth = auth as { baseUrl: string; apiVersion: string };
        const baseUrl = typedAuth.baseUrl.replace(/\/$/, '') ?? 'https://api.openai.com/v1';
        if (typedAuth.apiVersion) {
          return baseUrl + `?api-version=${typedAuth.apiVersion}`;
        } else {
          return baseUrl;
        }
      },
      authMapping: (auth) => {
        const typedAuth = auth as {
          baseUrl: string;
          apiKey: string;
          apiVersion: string;
        };
        if (typedAuth.apiVersion) {
          return {
            'api-key': typedAuth.apiKey,
          };
        } else {
          return {
            Authorization: `Bearer ${auth}`,
          };
        }
      },
    }),
  ],
  authors: [
    'aboudzein',
    'creed983',
    'astorozhevsky',
    'Salem-Alaa',
    'MoShizzle',
  ],
  triggers: [],
});
