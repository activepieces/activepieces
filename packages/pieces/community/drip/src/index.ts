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
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/drip.png',
  authors: ['AbdulTheActivePiecer'],
  auth: dripAuth,
  categories: [PieceCategory.MARKETING],
  actions: [
    dripApplyTagToSubscriber,
    dripAddSubscriberToCampaign,
    dripUpsertSubscriberAction,
  ],
  triggers: [dripNewSubscriberEvent, dripTagAppliedEvent],
});
