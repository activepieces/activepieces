import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { campaignOutputSchema } from '../output-schemas';

export const getCampaignAction = createAction({
	auth: mailerLiteAuth,
	name: 'get_campaign',
	classification: 'READ',
	displayName: 'Get Campaign',
	description: 'Get a campaign by ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Get one MailerLite campaign by ID, including status (draft, ready, sent), audience, emails and stats. Get the ID from list_campaigns. Read-only; returns a 404 error if the ID does not exist.',
		idempotent: true,
	},
	outputSchema: campaignOutputSchema,
	props: {
		campaign_id: Property.ShortText({
			displayName: 'Campaign ID',
			description: 'The campaign ID, from list_campaigns.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.campaign_id, label: 'Campaign ID' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/campaigns/${id}`,
			resource: `campaign ${id}`,
		});
		return mailerLiteApi.unwrapData(body);
	},
});
