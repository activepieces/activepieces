import { createAction } from '@activepieces/pieces-framework';

import { mauticListAssignableRolesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticListAssignableRolesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_assignable_roles',
	outputSchema: mauticListAssignableRolesOutputSchema,
	displayName: 'List Assignable Roles',
	description: 'Lists the roles a Mautic user can be given.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists role ids and names to use as Role Id in Create User or Update User.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await mauticApi.listAssignableRoles({ auth: context.auth });
	},
});
