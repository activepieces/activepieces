import { createAction, Property } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformListSubmissionsOutputSchema } from '../../../output-schemas';

const STATUS_OPTIONS = [
	{ label: 'Completed', value: 'completed' },
	{ label: 'Partial', value: 'partial' },
	{ label: 'All', value: 'all' },
];

export const opnformListSubmissionsAction = createAction({
	auth: opnformAuth,
	name: 'opnform_list_submissions',
	outputSchema: opnformListSubmissionsOutputSchema,
	displayName: 'List Submissions',
	description: 'Lists one page of submissions for a form.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of submissions for a form, each with its id and answers keyed by field id. Optionally filter by a search term or by status. Page through with Page and Per Page using the returned meta.',
		idempotent: true,
	},
	props: {
		formId: opnformAiProps.formId({ required: true }),
		search: Property.ShortText({
			displayName: 'Search',
			description: 'Optional text to search for in the answers.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description:
				'completed, partial (unfinished submissions, on forms with partial submissions enabled) or all. Leave empty for the API default.',
			required: false,
			options: {
				disabled: false,
				options: STATUS_OPTIONS,
			},
		}),
		page: opnformAiProps.page({ required: false }),
		perPage: opnformAiProps.perPage({ required: false }),
	},
	async run(context) {
		const { formId, search, status, page, perPage } = context.propsValue;
		return await opnformApi.listSubmissions({
			auth: context.auth,
			formId,
			search,
			status,
			page,
			perPage,
		});
	},
});
