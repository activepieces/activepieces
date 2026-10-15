import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaClient } from '../common/client';
import { emeliaProps } from '../common/props';

export const pauseCampaignAction = createAction({
	auth: emeliaAuth,
	name: 'pause_campaign',
	classification: 'WRITE',
	displayName: 'Pause Campaign',
	description: 'Pauses a running campaign. Use Start Campaign to resume it.',
	audience: 'both',
	aiMetadata: {
		description:
			'Pause a running Emelia multichannel campaign: scheduled sends and pending manual tasks are cancelled and recreated when it is started again with Start Campaign. Only RUNNING campaigns can be paused, so a retry after success errors.',
		idempotent: false,
	},
	props: {
		campaign: emeliaProps.campaignDropdown({ description: 'The running campaign to pause.' }),
	},
	async run(context) {
		const { campaign } = context.propsValue;
		await emeliaClient.request({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/advanced/campaigns/${encodeURIComponent(campaign)}/pause`,
		});
		return { success: true, campaign_id: campaign };
	},
});
