import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { sharedReportsOutputSchema } from '../../output-schemas';

export const listSharedReportsAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_shared_reports',
	outputSchema: sharedReportsOutputSchema,
	displayName: 'List Shared Reports',
	description: 'Lists the shared reports of a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists shared (saved) reports of a workspace with their IDs, names, types and visibility. Use it to find a shared report ID for Get Shared Report. Returns one page with the total count.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		filter: Property.StaticDropdown({
			displayName: 'Which Reports',
			description: 'Default All.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'ALL' },
					{ label: 'All (as admin)', value: 'ALL_ADMIN' },
					{ label: 'Created by me', value: 'CREATED_BY_ME' },
					{ label: 'Shared with me', value: 'SHARED_WITH_ME' },
				],
			},
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.listSharedReports({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({
				params: {
					sharedReportsFilter: propsValue.filter,
					page: propsValue.page ?? 1,
					pageSize: propsValue.pageSize ?? 50,
				},
			}),
		});
	},
});
