import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createAffiliateAction } from './lib/actions/create-affiliate';
import { createConversionAction } from './lib/actions/create-conversion';
import { getAffiliateAction } from './lib/actions/get-affiliate';
import { listAffiliatesAction } from './lib/actions/list-affiliates';
import {
  TAPFILIATE_BASE_URL,
  tapfiliateApiCall,
} from './lib/common/tapfiliate.client';

type TapfiliateValidateAuth = {
  apiKey?: string;
};

export const tapfiliateAuth = PieceAuth.CustomAuth({
  description: `To obtain your API key:

1. Log in to your Tapfiliate account.
2. Open your account settings.
3. Find the API key section.
4. Copy the API key and paste it here.`,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Tapfiliate REST API key sent in the X-Api-Key header.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const authValue = auth as TapfiliateValidateAuth;

    if (!authValue?.apiKey) {
      return {
        valid: false,
        error: 'API Key is required.',
      };
    }

    try {
      await tapfiliateApiCall({
        method: HttpMethod.GET,
        path: '/affiliates/',
        apiKey: authValue.apiKey,
      });

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});

export const tapfiliate = createPiece({
  displayName: 'Tapfiliate',
  description: 'Affiliate tracking and conversion management platform.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/tapfiliate.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: ['Harmatta'],
  auth: tapfiliateAuth,
  actions: [
    createAffiliateAction,
    getAffiliateAction,
    listAffiliatesAction,
    createConversionAction,
    createCustomApiCallAction({
      baseUrl: () => TAPFILIATE_BASE_URL,
      auth: tapfiliateAuth,
      authMapping: async (auth) => ({
        'X-Api-Key': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [],
});
