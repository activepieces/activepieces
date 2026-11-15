import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteRoleOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteRoleAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_role',
	outputSchema: mauticDeleteRoleOutputSchema,
	displayName: 'Delete Role',
	description: 'Permanently deletes a Mautic role.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a role; it must have no users. Needs an administrator account. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Role Id',
			description: 'Numeric role id, from List Roles or Create Role.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'roles',
			id: context.propsValue.id,
		});
	},
});
