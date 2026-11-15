import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const sendEmailCampaignNow = createAction({
	auth: sendinblueAuth,
	name: 'send_email_campaign_now',
	classification: 'WRITE',
	displayName: 'Send Email Campaign Now',
	description: 'Immediately send a draft Brevo email campaign to its recipient lists.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Immediately sends the given Brevo email campaign to every contact in its recipient lists, with no confirmation step and no way to recall it once sent. The campaign must currently be a draft. Not idempotent — retrying after a successful send fails because the campaign is no longer a draft, and a second successful call would email every recipient twice.',
		idempotent: false,
	},
	props: {
		campaign_id: Property.Number({
			displayName: 'Campaign ID',
			description: 'Must currently be a draft campaign.',
			required: true,
		}),
	},
	async run(context) {
		const { campaign_id } = context.propsValue;

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/emailCampaigns/${campaign_id}/sendNow`,
		});

		return { success: true };
	},
});
