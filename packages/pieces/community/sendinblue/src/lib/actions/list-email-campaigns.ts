import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listEmailCampaignsActionOutputSchema } from '../output-schemas';

export const listEmailCampaigns = createAction({
	auth: sendinblueAuth,
	name: 'list_email_campaigns',
	outputSchema: listEmailCampaignsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Email Campaigns',
	description: 'List email campaigns in the Brevo account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Brevo email campaigns with optional filters by type, status and date range, returning each campaign id, name, status and subject. Use this to resolve a campaign name to the numeric id that Get Email Campaign, Update Email Campaign and Send Email Campaign Now require. Start Date and End Date only narrow results when Status is "Sent" or left empty. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: false,
			options: {
				options: [
					{ label: 'Classic', value: 'classic' },
					{ label: 'Trigger', value: 'trigger' },
				],
			},
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				options: [
					{ label: 'Suspended', value: 'suspended' },
					{ label: 'Archive', value: 'archive' },
					{ label: 'Sent', value: 'sent' },
					{ label: 'Queued', value: 'queued' },
					{ label: 'Draft', value: 'draft' },
					{ label: 'In Process', value: 'inProcess' },
					{ label: 'In Review', value: 'inReview' },
				],
			},
		}),
		start_date: Property.DateTime({
			displayName: 'Start Date',
			description: 'Only applies when Status is "Sent" or left empty.',
			required: false,
		}),
		end_date: Property.DateTime({
			displayName: 'End Date',
			description: 'Only applies when Status is "Sent" or left empty.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of campaigns to return per page. Maximum 100. Defaults to 50.',
			required: false,
			defaultValue: 50,
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
		exclude_html_content: Property.Checkbox({
			displayName: 'Exclude HTML Content',
			description: 'Leave the HTML content out of each campaign in the response.',
			required: false,
		}),
	},
	async run(context) {
		const { type, status, start_date, end_date, limit, offset, sort, exclude_html_content } =
			context.propsValue;

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/emailCampaigns',
			query: {
				type,
				status,
				startDate: start_date,
				endDate: end_date,
				limit,
				offset,
				sort,
				excludeHtmlContent: exclude_html_content,
			},
		});
	},
});
