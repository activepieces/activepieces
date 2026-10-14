import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { getContactCampaignStatsActionOutputSchema } from '../output-schemas';

export const getContactCampaignStats = createAction({
	auth: sendinblueAuth,
	name: 'get_contact_campaign_stats',
	outputSchema: getContactCampaignStatsActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Contact Campaign Stats',
	description: `Get a contact's engagement statistics (opens, clicks, deliveries, and more) across campaigns.`,
	audience: 'ai',
	aiMetadata: {
		description:
			`Fetches a Brevo contact's campaign engagement statistics, such as opened, clicked, delivered, and unsubscribed events, optionally restricted to a date range. Start Date and End Date must both be supplied or both omitted, and Brevo caps the range at 90 days. Read-only and idempotent, though results can change over time as new engagement events occur.`,
		idempotent: true,
	},
	props: {
		identifier: Property.ShortText({
			displayName: 'Identifier',
			description: 'Email address or numeric contact id of the contact.',
			required: true,
		}),
		start_date: Property.ShortText({
			displayName: 'Start Date',
			description: 'YYYY-MM-DD. Must be supplied together with End Date.',
			required: false,
		}),
		end_date: Property.ShortText({
			displayName: 'End Date',
			description: 'YYYY-MM-DD. Must be supplied together with Start Date. Brevo caps the range at 90 days.',
			required: false,
		}),
	},
	async run(context) {
		const { identifier, start_date, end_date } = context.propsValue;

		if (isNil(start_date) !== isNil(end_date)) {
			throw new Error('Provide both Start Date and End Date, or neither.');
		}

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/contacts/${encodeURIComponent(identifier)}/campaignStats`,
			query: {
				startDate: start_date,
				endDate: end_date,
			},
		});
	},
});
