import { createAction } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaApi } from '../common/api';
import { emeliaProps } from '../common/props';

export const getCampaignAction = createAction({
	auth: emeliaAuth,
	name: 'get_campaign',
	classification: 'READ',
	displayName: 'Get Campaign',
	description: 'Gets the details of a campaign: status, dates, schedule, lists and senders.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one Emelia multichannel campaign: status, start and estimated end dates, sending schedule and daily limits, attached contact lists and sender names. For performance numbers (opens, replies, acceptances) use Get Campaign Statistics. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		campaign: emeliaProps.campaignDropdown({ description: 'The campaign to get.' }),
	},
	async run(context) {
		const campaign = await emeliaApi.getCampaign({
			apiKey: context.auth.secret_text,
			campaignId: context.propsValue.campaign,
		});
		return emeliaApi.flattenCampaign({ campaign });
	},
});
