import { createAction } from '@activepieces/pieces-framework';

import { mauticGetRoleOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetRoleAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_role',
	outputSchema: mauticGetRoleOutputSchema,
	displayName: 'Get Role',
	description: 'Gets one Mautic role by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single role by its numeric id, with its permissions.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Role Id',
			description: 'Numeric role id, from List Roles or Create Role.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'roles',
			id: context.propsValue.id,
		});
	},
});
