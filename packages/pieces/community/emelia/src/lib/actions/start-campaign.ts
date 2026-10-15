import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaClient } from '../common/client';
import { emeliaProps } from '../common/props';

export const startCampaignAction = createAction({
	auth: emeliaAuth,
	name: 'start_campaign',
	classification: 'WRITE',
	displayName: 'Start Campaign',
	description: 'Starts a draft campaign or resumes a paused one.',
	audience: 'both',
	aiMetadata: {
		description:
			'Start a draft Emelia multichannel campaign or resume a paused one. Emelia runs its launch checks first (sender identities, connected accounts, message content, recipients) and the action fails with the first failing check. Starting an already running campaign succeeds without change, so it is safe to retry.',
		idempotent: true,
	},
	props: {
		campaign: emeliaProps.campaignDropdown({ description: 'The campaign to start or resume.' }),
	},
	async run(context) {
		const { campaign } = context.propsValue;
		try {
			await emeliaClient.request({
				apiKey: context.auth.secret_text,
				method: HttpMethod.POST,
				path: `/advanced/campaigns/${encodeURIComponent(campaign)}/start`,
			});
			return { success: true, campaign_id: campaign, already_running: false };
		} catch (error) {
			if (emeliaClient.errorCode({ error }) === 'CAMPAIGN_ALREADY_RUNNING') {
				return { success: true, campaign_id: campaign, already_running: true };
			}
			throw error;
		}
	},
});
