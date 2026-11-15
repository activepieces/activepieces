import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { deleteCampaignOutputSchema } from '../output-schemas';

export const deleteCampaignAction = createAction({
	auth: mailerLiteAuth,
	name: 'delete_campaign',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Campaign',
	description: 'Delete a campaign.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently delete a MailerLite campaign by ID, including its content and, for sent campaigns, its reports. Cannot be undone. Get the ID from list_campaigns. Not idempotent: a repeat call returns a 404 error.',
		idempotent: false,
	},
	outputSchema: deleteCampaignOutputSchema,
	props: {
		campaign_id: Property.ShortText({
			displayName: 'Campaign ID',
			description: 'The campaign ID, from list_campaigns.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.campaign_id, label: 'Campaign ID' });
		await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			path: `/campaigns/${id}`,
			resource: `campaign ${id}`,
		});
		return { deleted: true, campaign_id: context.propsValue.campaign_id.trim() };
	},
});
