import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { listAffiliates } from './lib/actions/list-affiliates';
import { findAffiliate } from './lib/actions/find-affiliate';
import { createAffiliate } from './lib/actions/create-affiliate';
import { updateAffiliate } from './lib/actions/update-affiliate';
import { listReferrals } from './lib/actions/list-referrals';
import { findReferral } from './lib/actions/find-referral';
import { createReferral } from './lib/actions/create-referral';
import { listCommissions } from './lib/actions/list-commissions';
import { findCommission } from './lib/actions/find-commission';
import { listCampaigns } from './lib/actions/list-campaigns';
import { findCampaign } from './lib/actions/find-campaign';
import { listPayouts } from './lib/actions/list-payouts';
import { findPayout } from './lib/actions/find-payout';
import { newEvent } from './lib/triggers/new-event';
import { newAffiliateEvent } from './lib/triggers/new-affiliate-event';
import { newReferralEvent } from './lib/triggers/new-referral-event';
import { newCommissionEvent } from './lib/triggers/new-commission-event';

export const promotekitAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to your PromoteKit dashboard.
2. Go to **Settings > API Keys**.
3. Click **Create API Key**.
4. Copy the key and paste it here.
`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://www.promotekit.com/api/v1/affiliates',
        headers: { Authorization: `Bearer ${auth}` },
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API Key' };
    }
  },
});

export const promotekit = createPiece({
  displayName: 'PromoteKit',
  description: 'Affiliate marketing platform integrated with Stripe.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/promotekit.png',
  categories: [PieceCategory.MARKETING],
  auth: promotekitAuth,
  authors: ['BasTech'],
  actions: [
    listAffiliates,
    findAffiliate,
    createAffiliate,
    updateAffiliate,
    listReferrals,
    findReferral,
    createReferral,
    listCommissions,
    findCommission,
    listCampaigns,
    findCampaign,
    listPayouts,
    findPayout,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.promotekit.com/api/v1',
      auth: promotekitAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [newEvent, newAffiliateEvent, newReferralEvent, newCommissionEvent],
});
