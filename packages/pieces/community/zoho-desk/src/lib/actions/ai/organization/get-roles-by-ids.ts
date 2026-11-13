import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskListRolesOutputSchema } from '../../../output-schemas';

export const zohoDeskGetRolesByIdsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_roles_by_ids',
	outputSchema: zohoDeskListRolesOutputSchema,
	displayName: 'Get Roles By IDs',
	description: 'Gets several roles by ID in one call.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets several roles by ID in one call (IDs from List Roles or an agent's roleId), each with its name and parent role.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		roleIds: Property.Array({
			displayName: 'Role IDs',
			description: 'Role IDs to fetch (from List Roles).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, roleIds } = context.propsValue;
		const roles = await zohoDeskApi.getRolesByIds({
			auth: context.auth,
			orgId,
			roleIds: zohoDeskUtils.requiredStringList({ value: roleIds, propName: 'Role IDs' }),
		});
		return { roles, count: roles.length };
	},
});
