import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const getContactCampaignStats = createAction({
	auth: sendinblueAuth,
	name: 'get_contact_campaign_stats',
	classification: 'READ',
	displayName: 'Get Contact Campaign Stats',
	description: 'Email campaign statistics for one contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns how one Brevo contact has engaged with email campaigns — opens, clicks, bounces, unsubscribes and complaints — optionally bounded to a date range. Identify the contact by email address or numeric contact id only; unlike the other contact actions this endpoint does not accept external, WhatsApp or landline identifiers. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		identifier: Property.ShortText({
			displayName: 'Contact Identifier',
			description:
				'Email address or numeric contact id. External, WhatsApp and landline ids are not supported here.',
			required: true,
		}),
		start_date: Property.DateTime({
			displayName: 'Start Date',
			description: 'Beginning of the reporting window. Requires End Date.',
			required: false,
		}),
		end_date: Property.DateTime({
			displayName: 'End Date',
			description: 'End of the reporting window. Requires Start Date.',
			required: false,
		}),
	},
	async run(context) {
		const { identifier, start_date, end_date } = context.propsValue;

		if (Boolean(start_date) !== Boolean(end_date)) {
			throw new Error(
				'Start Date and End Date must be supplied together — Brevo rejects a one-sided range.',
			);
		}

		const stats = await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/contacts/${encodeURIComponent(identifier)}/campaignStats`,
			query: {
				startDate: start_date ? toDateOnly(start_date) : undefined,
				endDate: end_date ? toDateOnly(end_date) : undefined,
			},
		});

		return stats;
	},
});

function toDateOnly(value: string): string {
	return value.slice(0, 10);
}
