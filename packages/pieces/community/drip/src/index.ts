import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { dripAddSubscriberToCampaign } from './lib/actions/add-subscriber-to-campaign.action';
import { dripApplyTagToSubscriber } from './lib/actions/apply-tag-to-subscriber.action';
import { dripUpsertSubscriberAction } from './lib/actions/upsert-subscriber.action';
import { dripNewSubscriberEvent } from './lib/trigger/new-subscriber.trigger';
import { dripTagAppliedEvent } from './lib/trigger/new-tag.trigger';

export const dripAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Get it from https://www.getdrip.com/user/edit',
});

export const drip = createPiece({
  displayName: 'Drip',
  description: 'E-commerce CRM for B2B marketers',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/drip.png',
  authors: ["kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  categories: [PieceCategory.MARKETING],
  auth: dripAuth,
  actions: [
    dripApplyTagToSubscriber,
    dripAddSubscriberToCampaign,
    dripUpsertSubscriberAction,
    createCustomApiCallAction({
      baseUrl: () => `https://api.getdrip.com/v2/`,
      auth: dripAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(auth as string).toString(
          'base64'
        )}`,
      }),
    }),
  ],
  triggers: [dripNewSubscriberEvent, dripTagAppliedEvent],
});
