import {
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { clarifaiAskLLM } from './lib/actions/ask-llm';
import { audioToTextModelPredictAction } from './lib/actions/call-audio-model';
import {
  imageToTextModelPredictAction,
  visualClassifierModelPredictAction,
} from './lib/actions/call-image-model';
import { postInputsAction } from './lib/actions/call-post-inputs';
import {
  textClassifierModelPredictAction,
  textToTextModelPredictAction,
} from './lib/actions/call-text-model';
import { workflowPredictAction } from './lib/actions/call-workflow';
import { clarifaiGenerateIGM } from './lib/actions/generate-igm';

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
  description: 'AI-powered visual recognition',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/clarifai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["akatechis","zeiler","Salem-Alaa","kishanprmr","MoShizzle","abuaboud"],
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
      authMapping: async (auth) => ({
        Authorization: `Key ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
