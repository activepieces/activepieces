import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallySubmissionsApiResponse } from '../common/types';

export const listFormSubmissions = createAction({
	auth: tallyAuth,
	name: 'list_form_submissions',
	displayName: 'List Form Submissions',
	description: 'Lists submissions for a form, paginated.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Lists submissions for a form as a paginated response with the shape { questions, submissions } — the top-level `questions` map lets you resolve response answer ids to their question titles. Use to batch-read historical form responses; for realtime notifications when a new submission arrives use the New Submission trigger (webhook) instead. Filter by `completed` to exclude drafts; set `afterId` for cursor-style pagination when polling.",
		idempotent: true,
	},
	props: {
		form_id: Property.ShortText({
			displayName: 'Form ID',
			description: 'The id of the form. Obtain from List Forms.',
			required: true,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of submissions per page.',
			required: false,
			defaultValue: 50,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to fetch, starting at 1.',
			required: false,
			defaultValue: 1,
		}),
		filter: Property.StaticDropdown({
			displayName: 'Filter',
			description: 'Only return submissions matching this filter.',
			required: false,
			options: {
				options: [
					{ label: 'All', value: '' },
					{ label: 'Completed only', value: 'completed' },
				],
			},
		}),
		after_id: Property.ShortText({
			displayName: 'After Submission ID',
			description: 'Return submissions created after this id (cursor pagination).',
			required: false,
		}),
	},
	async run(context) {
		const queryParams: Record<string, string> = {
			page: String(context.propsValue.page ?? 1),
			limit: String(context.propsValue.limit ?? 50),
		};
		if (context.propsValue.filter) queryParams['filter'] = context.propsValue.filter;
		if (context.propsValue.after_id) queryParams['afterId'] = context.propsValue.after_id;
		return tallyApiClient.request<TallySubmissionsApiResponse>({
			method: HttpMethod.GET,
			path: `/forms/${context.propsValue.form_id}/submissions`,
			apiKey: context.auth.secret_text,
			queryParams,
		});
	},
});
