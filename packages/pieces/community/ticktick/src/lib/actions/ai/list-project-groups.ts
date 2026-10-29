import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickListProjectGroupsOutputSchema } from '../../output-schemas';

export const listProjectGroupsAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_project_groups',
	outputSchema: ticktickListProjectGroupsOutputSchema,
	displayName: 'List Project Groups',
	description: 'Lists the project groups (folders) of the connected account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists project groups with their ids and names. Use to get the projectGroupId for ticktick_update_project_group or ticktick_delete_project_group. Read-only.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const groups = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: '/project/group',
		});
		return { groups, count: groups.length };
	},
});
