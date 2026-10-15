import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { addContactToCampaignAction } from './lib/actions/add-contact-to-campaign';
import { addContactToListAction } from './lib/actions/add-contact-to-list';
import { addToBlacklistAction } from './lib/actions/add-to-blacklist';
import { findContactInListAction } from './lib/actions/find-contact-in-list';
import { findEmailAction } from './lib/actions/find-email';
import { findPhoneAction } from './lib/actions/find-phone';
import { getCampaignAction } from './lib/actions/get-campaign';
import { getCampaignStatsAction } from './lib/actions/get-campaign-stats';
import { pauseCampaignAction } from './lib/actions/pause-campaign';
import { removeContactFromCampaignAction } from './lib/actions/remove-contact-from-campaign';
import { startCampaignAction } from './lib/actions/start-campaign';
import { verifyEmailAction } from './lib/actions/verify-email';
import { emeliaAuth } from './lib/auth';
import { emeliaClient } from './lib/common/client';
import { newCampaignActivityTrigger } from './lib/triggers/new-campaign-activity';
import { newReplyTrigger } from './lib/triggers/new-reply';

export const emelia = createPiece({
	displayName: 'Emelia',
	description: 'Cold email and LinkedIn prospecting platform with multichannel campaigns, contact lists and email/phone enrichment.',
	auth: emeliaAuth,
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/emelia.png',
	categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
	authors: ['mdaunois'],
	actions: [
		addContactToCampaignAction,
		removeContactFromCampaignAction,
		addContactToListAction,
		findContactInListAction,
		startCampaignAction,
		pauseCampaignAction,
		getCampaignAction,
		getCampaignStatsAction,
		findEmailAction,
		findPhoneAction,
		verifyEmailAction,
		addToBlacklistAction,
		createCustomApiCallAction({
			auth: emeliaAuth,
			baseUrl: () => emeliaClient.BASE_URL,
			authMapping: async (auth) => ({
				Authorization: auth.secret_text,
			}),
		}),
	],
	triggers: [newReplyTrigger, newCampaignActivityTrigger],
});
