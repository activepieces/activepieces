import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { dripAddSubscriberToCampaign } from './lib/actions/add-subscriber-to-campaign.action';
import { dripApplyTagToSubscriber } from './lib/actions/apply-tag-to-subscriber.action';
import { dripUpsertSubscriberAction } from './lib/actions/upsert-subscriber.action';
import { dripNewSubscriberEvent } from './lib/trigger/new-subscriber.trigger';
import { dripTagAppliedEvent } from './lib/trigger/new-tag.trigger';


export const drip = createPiece({
	name: 'drip',
	displayName: 'Drip',
	logoUrl: 'https://cdn.activepieces.com/pieces/drip.png',
	version: packageJson.version,
	type: PieceType.PUBLIC,
	authors: ['AbdulTheActivePiecer'],
	actions: [dripApplyTagToSubscriber, dripAddSubscriberToCampaign, dripUpsertSubscriberAction],
	triggers: [dripNewSubscriberEvent, dripTagAppliedEvent],
});
