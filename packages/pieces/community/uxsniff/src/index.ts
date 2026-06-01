import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { newFeedbackTrigger } from './lib/triggers/new-feedback';
import { newSurveyResponseTrigger } from './lib/triggers/new-survey-response';

export const uxsniffAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your UXsniff API key:
1. Log in to your UXsniff account.
2. Open the [Account page](https://app.uxsniff.com/login?next=account).
3. Copy your API Key and paste it below.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.uxsniff.com/v1/list-survey',
        headers: { Authorization: auth },
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key. Find it on your UXsniff Account page.',
      };
    }
  },
});

export const uxsniff = createPiece({
  displayName: 'UXsniff',
  description:
    'AI-powered UX analytics: session recordings, heatmaps, feedback widgets, and surveys for your website.',
  auth: uxsniffAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/uxsniff.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.MARKETING],
  authors: ['sanket'],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => 'https://api.uxsniff.com/v1',
      auth: uxsniffAuth,
      authMapping: async (auth) => ({
        Authorization: (auth as { secret_text: string }).secret_text,
      }),
    }),
  ],
  triggers: [newFeedbackTrigger, newSurveyResponseTrigger],
});
