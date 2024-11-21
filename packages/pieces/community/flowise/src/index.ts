import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createAction,
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

const flowiseAuth = PieceAuth.CustomAuth({
  description: 'Enter your Flowise URL and API Key',
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description: 'Enter the base URL',
      required: true,
    }),
    access_token: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Enter the API Key',
      required: true,
    }),
  },
  required: true,
});

// /api/v1/prediction/{your-chatflowid}
export const flowisePredict = createAction({
  name: 'make_prediction',
  displayName: 'Make Prediction',
  description: 'Run Flowise Predict',
  auth: flowiseAuth,
  props: {
    chatflow_id: Property.ShortText({
      displayName: 'Chatflow ID',
      description: 'Enter the Chatflow ID',
      required: true,
    }),
    input: Property.ShortText({
      displayName: 'Input/Question',
      description: 'Enter the Input/Question',
      required: true,
    }),
    history: Property.Json({
      displayName: 'History',
      description: 'Enter the History',
      required: false,
    }),
    overrideConfig: Property.Json({
      displayName: 'Override Config',
      description: 'Enter the Override Config',
      required: false,
    }),
  },
  async run(ctx) {
    const { base_url, access_token } = ctx.auth;
    const chatflow_id = ctx.propsValue['chatflow_id'];
    const input = ctx.propsValue['input'];
    const url = `${base_url}/api/v1/prediction/${chatflow_id}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    };
    const body = {
      question: input,
      history: ctx.propsValue['history'],
      overrideConfig: ctx.propsValue['overrideConfig'],
    };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return data;
  },
});

export const flowise = createPiece({
  displayName: 'Flowise',
  description: 'No-Code AI workflow builder',

  logoUrl: 'https://cdn.activepieces.com/pieces/flowise.png',
  auth: flowiseAuth,
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["aasimsani","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    flowisePredict,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { base_url: string }).base_url,
      auth: flowiseAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${
          (auth as { access_token: string }).access_token
        }`,
      }),
    }),
  ],
  triggers: [],
});
