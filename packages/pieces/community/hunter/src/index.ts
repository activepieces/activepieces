import {
  createPiece,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { hunterVerifyEmailAction } from './lib/actions/verify-email-action';
import { hunterNewLeadTrigger } from './lib/triggers/new-lead.trigger';

// Authentication for the Hunter piece. Users must supply their Hunter API key.
export const hunterAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
    To obtain your API key:
    1. Log in to your Hunter account.
    2. Navigate to the **API** section of your dashboard.
    3. Copy your API key and paste it here.
  `,
});

export const hunter = createPiece({
  displayName: 'Hunter',
  description:
    'Connect to Hunter to verify email addresses and monitor new leads.',
  minimumSupportedRelease: '0.30.0',
  // Placeholder logo; Activepieces hosts piece logos at this CDN. If a custom
  // logo is needed, upload it separately and update this URL accordingly.
  logoUrl: 'https://cdn.activepieces.com/pieces/hunter.png',
  authors: ['kishanprmr'],
  categories: [PieceCategory.SALES_AND_CRM],
  auth: hunterAuth,
  actions: [
    hunterVerifyEmailAction,
    // Allow users to call any Hunter API endpoint through a custom API call.
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://api.hunter.io/v2';
      },
      auth: hunterAuth,
      authMapping: async (auth) => ({
        'X-API-KEY': auth,
      }),
    }),
  ],
  triggers: [hunterNewLeadTrigger],
});
