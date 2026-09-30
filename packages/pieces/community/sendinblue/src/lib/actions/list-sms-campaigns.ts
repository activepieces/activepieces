import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listSmsCampaignsActionOutputSchema } from '../output-schemas';

export const listSmsCampaigns = createAction({
	auth: sendinblueAuth,
	name: 'list_sms_campaigns',
	outputSchema: listSmsCampaignsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List SMS Campaigns',
	description: 'List the SMS campaigns in the Brevo account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Brevo SMS campaigns with their id, name, status and statistics, optionally filtered by status or sent date range. Use this to resolve a campaign name to the numeric id that Get SMS Campaign and Delete SMS Campaign require. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				options: [
					{ label: 'Sent', value: 'sent' },
					{ label: 'Draft', value: 'draft' },
					{ label: 'Queued', value: 'queued' },
					{ label: 'Suspended', value: 'suspended' },
					{ label: 'In Process', value: 'inProcess' },
					{ label: 'Archive', value: 'archive' },
				],
			},
		}),
		start_date: Property.DateTime({
			displayName: 'Start Date',
			description: 'Only filters sent campaigns; both required together.',
			required: false,
		}),
		end_date: Property.DateTime({
			displayName: 'End Date',
			description: 'Only filters sent campaigns; both required together.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of campaigns to return per page. Maximum 1000.',
			required: false,
			defaultValue: 500,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Index of the first campaign to return. Defaults to 0.',
			required: false,
			defaultValue: 0,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort order for the results, based on the campaign creation date.',
			required: false,
			options: {
				options: [
					{ label: 'Ascending', value: 'asc' },
					{ label: 'Descending', value: 'desc' },
				],
			},
		}),
	},
	async run(context) {
		const { status, start_date, end_date, limit, offset, sort } = context.propsValue;

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/smsCampaigns',
			query: {
				status,
				startDate: start_date,
				endDate: end_date,
				limit,
				offset,
				sort,
			},
		});
	},
});
