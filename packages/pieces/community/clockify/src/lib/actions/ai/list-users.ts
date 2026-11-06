import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { usersOutputSchema } from '../../output-schemas';

const STATUS_OPTIONS = [
	{ label: 'Active', value: 'ACTIVE' },
	{ label: 'Pending', value: 'PENDING' },
	{ label: 'Declined', value: 'DECLINED' },
	{ label: 'Inactive', value: 'INACTIVE' },
	{ label: 'All', value: 'ALL' },
];

const ROLE_OPTIONS = [
	{ label: 'Owner', value: 'OWNER' },
	{ label: 'Workspace Admin', value: 'WORKSPACE_ADMIN' },
	{ label: 'Team Manager', value: 'TEAM_MANAGER' },
	{ label: 'Project Manager', value: 'PROJECT_MANAGER' },
];

export const listUsersAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_users',
	outputSchema: usersOutputSchema,
	displayName: 'List Users',
	description: 'Lists or searches the members of a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the members of a Clockify workspace, optionally filtered by email, name, status, project, user groups or roles. Use it to find a user ID by email or name. Returns one page; ask for the next page while count equals the page size.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Optional: only users whose email contains this text.',
			required: false,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Optional: only users whose name contains this text.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Optional: only users with this status.',
			required: false,
			options: { disabled: false, options: STATUS_OPTIONS },
		}),
		projectId: clockifyAiProps.projectId({
			required: false,
			description: 'Optional: only members of this project. Use List Projects to find it.',
		}),
		userGroupIds: Property.Array({
			displayName: 'User Group IDs',
			description:
				'Optional: only members of these user groups. Use List User Groups to find them.',
			required: false,
		}),
		roles: Property.StaticMultiSelectDropdown({
			displayName: 'Roles',
			description: 'Optional: only users with one of these roles.',
			required: false,
			options: { disabled: false, options: ROLE_OPTIONS },
		}),
		includeRoles: Property.Checkbox({
			displayName: 'Include Roles',
			description: 'Also return each user role. Default false.',
			required: false,
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const users = await clockifyApi.filterUsers({
			auth,
			workspaceId: propsValue.workspaceId,
			filter: {
				email: propsValue.email,
				name: propsValue.name,
				status: propsValue.status,
				projectId: propsValue.projectId,
				userGroups: propsValue.userGroupIds?.map(String),
				roles: propsValue.roles,
				includeRoles: propsValue.includeRoles,
				page: propsValue.page ?? 1,
				pageSize: propsValue.pageSize ?? 50,
			},
		});
		return { users, count: users.length };
	},
});
