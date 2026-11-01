import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteUserOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteUserAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_user',
	outputSchema: mauticDeleteUserOutputSchema,
	displayName: 'Delete User',
	description: 'Permanently deletes a Mautic user.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a user. Needs an administrator account. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'User Id',
			description: 'Numeric user id, from List Users or Create User.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'users',
			id: context.propsValue.id,
		});
	},
});
