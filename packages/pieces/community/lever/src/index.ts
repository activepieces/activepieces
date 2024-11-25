import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getOpportunity } from './lib/actions/get-opportunity';
import { updateOpportunityStage } from './lib/actions/update-opportunity-stage';
import { listOpportunityForms } from './lib/actions/list-opportunity-forms';
import { listOpportunityFeedback } from './lib/actions/list-opportunity-feedback';
import { addFeedbackToOpportunity } from './lib/actions/add-feedback-to-opportunity';
import { PieceCategory } from '@activepieces/shared';

export const LEVER_BASE_URL = 'https://api.lever.co/v1';

export const leverAuth = PieceAuth.CustomAuth({
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API key',
      required: true,
    }),
  },
  required: true,
});

export type LeverAuth = {
  apiKey: string;
};
export const lever = createPiece({
  displayName: 'Lever',
  auth: leverAuth,
  description:
    'Lever is a modern, collaborative recruiting platform that powers a more human approach to hiring.',
  categories: [PieceCategory.HUMAN_RESOURCES],
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/lever.png',
  authors: ['AdamSelene'],
  actions: [
    getOpportunity,
    updateOpportunityStage,
    listOpportunityForms,
    listOpportunityFeedback,
    addFeedbackToOpportunity,
    createCustomApiCallAction({
      baseUrl: () => {
        return LEVER_BASE_URL;
      },
      auth: leverAuth,
      authMapping: async (auth) => {
        const { apiKey } = auth as LeverAuth;
        return {
          Authorization:
            'Basic ' + Buffer.from(`${apiKey}:`).toString('base64'),
        };
      },
    }),
  ],
  triggers: [],
});
