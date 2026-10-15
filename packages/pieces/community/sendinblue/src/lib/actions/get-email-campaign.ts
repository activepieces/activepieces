import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { getEmailCampaignActionOutputSchema } from '../output-schemas';

export const getEmailCampaign = createAction({
	auth: sendinblueAuth,
	name: 'get_email_campaign',
	outputSchema: getEmailCampaignActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Email Campaign',
	description: 'Fetch a Brevo email campaign by id, including its statistics.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetches a single Brevo email campaign by its numeric id, including its recipients, content and send statistics. Pass Statistics to limit the returned report to one category (e.g. Global Stats) instead of the full report. Returns found:false instead of failing when the campaign id does not exist, so it is safe to branch on. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		campaign_id: Property.Number({
			displayName: 'Campaign ID',
			required: true,
		}),
		statistics: Property.StaticDropdown({
			displayName: 'Statistics',
			description: 'Limit the returned statistics to one category; omit for the full report.',
			required: false,
			options: {
				options: [
					{ label: 'Global Stats', value: 'globalStats' },
					{ label: 'Links Stats', value: 'linksStats' },
					{ label: 'Stats By Domain', value: 'statsByDomain' },
					{ label: 'Stats By Device', value: 'statsByDevice' },
					{ label: 'Stats By Browser', value: 'statsByBrowser' },
				],
			},
		}),
	},
	async run(context) {
		const { campaign_id, statistics } = context.propsValue;

		try {
			const campaign = await brevoCommon.apiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/emailCampaigns/${campaign_id}`,
				query: { statistics },
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
