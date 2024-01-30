import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import {
  visualClassifierModelPredictAction,
  imageToTextModelPredictAction,
} from './lib/actions/call-image-model';
import {
  textToTextModelPredictAction,
  textClassifierModelPredictAction,
} from './lib/actions/call-text-model';
import { audioToTextModelPredictAction } from './lib/actions/call-audio-model';
import { postInputsAction } from './lib/actions/call-post-inputs';
import { workflowPredictAction } from './lib/actions/call-workflow';
import { clarifaiAskLLM } from './lib/actions/ask-llm';
import { clarifaiGenerateIGM } from './lib/actions/generate-igm';
import {
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';

const markdownDescription = `
Follow these instructions to get your Clarifai (Personal Access Token) PAT Key:
1. Go to the [security tab](https://clarifai.com/settings/security) in your Clarifai account and generate a new PAT token.
2. Copy the PAT token and paste it in the PAT Key field.
`;
export const clarifaiAuth = PieceAuth.SecretText({
  displayName: 'PAT Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.clarifai.com/v2/models',
        headers: {
          Authorization: 'Key ' + auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: `Invalid PAT token\nerror:\n${e}`,
      };
    }
  },
});

export const clarifai = createPiece({
  displayName: 'Clarifai',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/clarifai.png',
  authors: ['akatechis', 'Salem-Alaa'],
  auth: clarifaiAuth,
  actions: [
    clarifaiAskLLM,
    clarifaiGenerateIGM,
    visualClassifierModelPredictAction,
    textClassifierModelPredictAction,
    imageToTextModelPredictAction,
    textToTextModelPredictAction,
    audioToTextModelPredictAction,
    postInputsAction,
    workflowPredictAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.clarifai.com/v2', // Replace with the actual base URL
      auth: clarifaiAuth,
      authMapping: (auth) => ({
        Authorization: `Key ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
