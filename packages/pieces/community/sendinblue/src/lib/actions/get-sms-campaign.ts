import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { getSmsCampaignActionOutputSchema } from '../output-schemas';

export const getSmsCampaign = createAction({
	auth: sendinblueAuth,
	name: 'get_sms_campaign',
	outputSchema: getSmsCampaignActionOutputSchema,
	classification: 'READ',
	displayName: 'Get SMS Campaign',
	description: 'Get the details of a single Brevo SMS campaign by id.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetches a single Brevo SMS campaign by its numeric id, including its status, content, recipient targeting and statistics. Returns found:false instead of failing when the campaign id does not exist, so it is safe to branch on. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		campaign_id: Property.Number({
			displayName: 'Campaign ID',
			required: true,
		}),
	},
	async run(context) {
		const { campaign_id } = context.propsValue;

		try {
			const campaign = await brevoCommon.apiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/smsCampaigns/${campaign_id}`,
			});

			return { found: true, data: campaign };
		} catch (error) {
			if (error instanceof HttpError && error.response.status === 404) {
				return { found: false, data: {} };
			}
			throw error;
		}
	},
});
