import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { listTestimonialsAction } from './lib/actions/list-testimonials';
import { getTestimonialAction } from './lib/actions/get-testimonial';
import { createTestimonialAction } from './lib/actions/create-testimonial';
import { testimonialEventTrigger } from './lib/triggers/testimonial-event';
import { SENJA_BASE_URL } from './lib/common';

export const senjaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your Senja API key:
1. Log in to your Senja account.
2. Go to **Automate** in the left sidebar.
3. Click **REST API** and copy your API key.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SENJA_BASE_URL}/testimonials`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API Key. Please check and try again.' };
    }
  },
});

export const senja = createPiece({
  displayName: 'Senja',
  description: 'Collect, manage, and share testimonials with Senja.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/senja.png',
  categories: [PieceCategory.MARKETING],
  auth: senjaAuth,
  authors: ['bst1n', 'onyedikachi-david'],
  actions: [
    listTestimonialsAction,
    getTestimonialAction,
    createTestimonialAction,
    createCustomApiCallAction({
      baseUrl: () => SENJA_BASE_URL,
      auth: senjaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [testimonialEventTrigger],
});
