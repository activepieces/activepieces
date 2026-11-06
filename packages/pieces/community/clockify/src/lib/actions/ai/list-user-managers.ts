import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { managersOutputSchema } from '../../output-schemas';

export const listUserManagersAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_user_managers',
	outputSchema: managersOutputSchema,
	displayName: 'List User Managers',
	description: "Lists a user's team managers.",
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the team managers of one workspace member, for example to find who approves their timesheets. Returns one page of users.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({ required: true }),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const managers = await clockifyApi.listUserManagers({
			auth,
			workspaceId: propsValue.workspaceId,
			userId: propsValue.userId,
			query: { page: String(propsValue.page ?? 1), 'page-size': String(propsValue.pageSize ?? 50) },
		});
		return { managers, count: managers.length };
	},
});
