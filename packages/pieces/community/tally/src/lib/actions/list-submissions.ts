import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { formsDropdown } from '../common/props';
import { listSubmissionsActionOutputSchema } from '../output-schemas';

export const listSubmissionsAction = createAction({
	auth: tallyAuth,
	name: 'list_submissions',
	classification: 'SEARCH',
	displayName: 'List Submissions',
	description: 'List a form\'s submissions, with filters for status and date range',
	audience: 'ai',
	outputSchema: listSubmissionsActionOutputSchema,
	aiMetadata: {
		description:
			'Lists a form\'s submissions with pagination and optional completion/date filters, including each response keyed by questionId. Use List Form Questions to resolve questionId to a label. For a single known submission use Get Submission instead. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		form_id: formsDropdown,
		filter: Property.StaticDropdown({
			displayName: 'Filter',
			description: 'Filter by submission completion status. Defaults to all.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Completed', value: 'completed' },
					{ label: 'Partial', value: 'partial' },
				],
			},
		}),
		start_date: Property.ShortText({
			displayName: 'Start Date',
			description: 'ISO 8601 date-time. Include submissions on or after this date.',
			required: false,
		}),
		end_date: Property.ShortText({
			displayName: 'End Date',
			description: 'ISO 8601 date-time. Include submissions on or before this date.',
			required: false,
		}),
		after_id: Property.ShortText({
			displayName: 'After Submission ID',
			description: 'Return submissions after this submission id (cursor-style pagination).',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number, starting at 1. Defaults to 1.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Submissions per page (max 500). Defaults to 50.',
			required: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.listSubmissions({
			apiKey: auth.secret_text,
			formId: propsValue.form_id,
			filter: propsValue.filter,
			startDate: propsValue.start_date,
			endDate: propsValue.end_date,
			afterId: propsValue.after_id,
			page: propsValue.page,
			limit: propsValue.limit,
		});
	},
});
