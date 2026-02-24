import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addedSubscriber } from './lib/triggers/added-subscriber';
import { unsubscribedSubscriber } from './lib/triggers/unsubscribed-subscriber';
import { taggedSubscriber } from './lib/triggers/tagged-subscriber';
import { createSubscriber } from './lib/actions/create-subscriber';
import { tagSubscriber } from './lib/actions/tag-subscriber';
import { updateSubscriber } from './lib/actions/update-subscriber';
import { searchSubscriberByEmail } from './lib/actions/search-subscriber-by-email';
import { getSubscriberDetails } from './lib/actions/get-subscriber-details';
import { getCampaignDetails } from './lib/actions/get-campaign-details';
import { zagoMailApiService } from './lib/common/request';
import { zagomailAuth } from './lib/auth';

export const zagomail = createPiece({
	displayName: 'Zagomail',
	description: 'All-in-one email marketing and automation platform',
	logoUrl: 'https://cdn.activepieces.com/pieces/zagomail.png',
	authors: ['gs03dev'],
	auth: zagomailAuth,
	actions: [
		createSubscriber,
		tagSubscriber,
		updateSubscriber,

		searchSubscriberByEmail,

		getSubscriberDetails,
		getCampaignDetails,
	],
	triggers: [addedSubscriber, unsubscribedSubscriber, taggedSubscriber],
	categories: [PieceCategory.MARKETING],
});
