import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { userGroupsOutputSchema } from '../../output-schemas';

export const listUserGroupsAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_user_groups',
	outputSchema: userGroupsOutputSchema,
	displayName: 'List User Groups',
	description: 'Lists or searches the user groups of a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the user groups (teams) of a Clockify workspace with their member IDs, optionally filtered by name or by project. Use it to find a user group ID. Returns one page.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Optional: only groups whose name contains this text.',
			required: false,
		}),
		projectId: clockifyAiProps.projectId({
			required: false,
			description:
				'Optional: only groups that are members of this project. Use List Projects to find it.',
		}),
		includeTeamManagers: Property.Checkbox({
			displayName: 'Include Team Managers',
			description: 'Also return each group team managers. Default false.',
			required: false,
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const userGroups = await clockifyApi.listUserGroups({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({
				params: {
					name: propsValue.name,
					'project-id': propsValue.projectId,
					includeTeamManagers: propsValue.includeTeamManagers,
					page: propsValue.page ?? 1,
					'page-size': propsValue.pageSize ?? 50,
				},
			}),
		});
		return { userGroups, count: userGroups.length };
	},
});
