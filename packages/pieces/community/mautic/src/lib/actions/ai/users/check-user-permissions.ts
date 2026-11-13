import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticCheckUserPermissionsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticCheckUserPermissionsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_check_user_permissions',
	outputSchema: mauticCheckUserPermissionsOutputSchema,
	displayName: 'Check User Permissions',
	description: 'Checks whether a Mautic user has given permissions.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Checks permission strings for a user and returns true or false for each, e.g. "email:emails:send". Read-only.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'User Id',
			description: 'Numeric user id, from List Users or Get Current User.',
		}),
		permissions: Property.Array({
			displayName: 'Permissions',
			description: 'Permission strings, e.g. "lead:leads:viewother", "email:emails:send".',
			required: true,
		}),
	},
	async run(context) {
		return await mauticApi.checkUserPermissions({
			auth: context.auth,
			id: context.propsValue.id,
			permissions: mauticUtils.toBatchIds({ ids: context.propsValue.permissions }),
		});
	},
});
