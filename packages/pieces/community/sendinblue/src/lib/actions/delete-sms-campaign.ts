import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const deleteSmsCampaign = createAction({
	auth: sendinblueAuth,
	name: 'delete_sms_campaign',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete SMS Campaign',
	description: 'Permanently delete a Brevo SMS campaign.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a Brevo SMS campaign by id, whether it is a draft or already sent. This cannot be undone. Not idempotent — a retry after the first successful call 404s because the campaign no longer exists.',
		idempotent: false,
	},
	props: {
		campaign_id: Property.Number({
			displayName: 'Campaign ID',
			required: true,
		}),
	},
	async run(context) {
		const { campaign_id } = context.propsValue;

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/smsCampaigns/${campaign_id}`,
		});

		return { success: true };
	},
});
