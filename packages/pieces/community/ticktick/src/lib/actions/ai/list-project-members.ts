import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickListProjectMembersOutputSchema } from '../../output-schemas';

export const listProjectMembersAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_project_members',
	outputSchema: ticktickListProjectMembersOutputSchema,
	displayName: 'List Project Members',
	description: 'Lists the members of a TickTick project.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists a shared project\'s members (username, displayName, self). Use to get the username that ticktick_assign_task needs. Read-only.',
		idempotent: true,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The project ID, from the List Projects action.',
			required: true,
		}),
	},
	async run(context) {
		const members = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${context.propsValue.projectId}/members`,
		});
		return { members, count: members.length };
	},
});
