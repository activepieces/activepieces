import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetRoleOutputSchema } from '../../../output-schemas';

export const zohoDeskGetRoleAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_role',
	outputSchema: zohoDeskGetRoleOutputSchema,
	displayName: 'Get Role',
	description: 'Gets a role by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one role by ID with its name, parent role and sub-roles.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		roleId: Property.ShortText({
			displayName: 'Role ID',
			description: 'Role ID (from List Roles).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, roleId } = context.propsValue;
		return await zohoDeskApi.getRole({ auth: context.auth, orgId, roleId });
	},
});
