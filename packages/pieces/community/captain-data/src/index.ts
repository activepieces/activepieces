import {
  createPiece,
  PieceAuth,
  Property,
} from '@ensemble/pieces-framework';
import { createCustomApiCallAction } from '@ensemble/pieces-common';
import { launchWorkflow } from './lib/actions/launch-workflow';
import { getJobResults } from './lib/actions/get-job-results';

export const CAPTAIN_DATA_BASE_URL = 'https://api.captaindata.co/v3';

export const captainDataAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API key',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      required: true,
    }),
  },
});

export type CaptainDataAuthType = {
  apiKey: string;
  projectId: string;
};

export const captainData = createPiece({
  displayName: 'Captain-data',
  auth: captainDataAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/captain-data.png',
  authors: ['AdamSelene'],
  actions: [
    launchWorkflow,
    getJobResults,
    createCustomApiCallAction({
      auth: captainDataAuth,
      baseUrl: () => CAPTAIN_DATA_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `x-api-key ${(auth as CaptainDataAuthType).apiKey}`,
        'x-project-id': (auth as CaptainDataAuthType).projectId,
      }),
    }),
  ],
  triggers: [],
});
