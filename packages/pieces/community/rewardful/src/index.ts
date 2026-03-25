import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { rewardfulAuth, rewardfulBasicToken, REWARDFUL_BASE_URL } from './lib/auth';
import { createReferralAction } from './lib/actions/create-referral';
import { getReferralAction } from './lib/actions/get-referral';
import { listAffiliatesAction } from './lib/actions/list-affiliates';
import { listCampaignsAction } from './lib/actions/list-campaigns';

export const rewardful = createPiece({
  displayName: 'Rewardful',
  description: 'Affiliate and referral tracking for SaaS and subscription businesses.',
  auth: rewardfulAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://developers.rewardful.com/favicon.ico',
  categories: [PieceCategory.MARKETING],
  authors: ['Harmatta'],
  actions: [
    listCampaignsAction,
    createReferralAction,
    getReferralAction,
    listAffiliatesAction,
    createCustomApiCallAction({
      baseUrl: () => REWARDFUL_BASE_URL,
      auth: rewardfulAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${rewardfulBasicToken(auth?.props?.apiSecret ?? '')}`,
      }),
    }),
  ],
  triggers: [],
});
