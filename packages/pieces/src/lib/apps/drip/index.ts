import { createPiece } from '../../framework/piece';
import { dripNewSubscriberEvent } from './trigger/new-subscriber.trigger';


export const drip = createPiece({
	name: 'drip',
	displayName: "Drip",
	logoUrl: 'https://1445333.fs1.hubspotusercontent-na1.net/hubfs/1445333/raw_assets/public/drip/images/logos/og-logo.png',
	actions: [],
	triggers: [dripNewSubscriberEvent],
});
