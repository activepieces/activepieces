import { createPiece } from '../../framework/piece';
import { dripAddSubscriberToCampaign } from './actions/add-subscriber-to-campaign.action';
import { dripApplyTagToSubscriber } from './actions/apply-tag-to-subscriber.action';
import { dripUpsertSubscriberAction } from './actions/upsert-subscriber.action';
import { dripNewSubscriberEvent } from './trigger/new-subscriber.trigger';
import { dripTagAppliedEvent } from './trigger/new-tag.trigger';


export const drip = createPiece({
	name: 'drip',
	displayName: "Drip",
	logoUrl: 'https://1445333.fs1.hubspotusercontent-na1.net/hubfs/1445333/raw_assets/public/drip/images/logos/og-logo.png',
	actions: [dripApplyTagToSubscriber, dripAddSubscriberToCampaign, dripUpsertSubscriberAction],
	triggers: [dripNewSubscriberEvent, dripTagAppliedEvent],
});
