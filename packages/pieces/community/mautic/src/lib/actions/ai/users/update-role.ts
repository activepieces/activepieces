import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticUpdateRoleOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateRoleAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_role',
	outputSchema: mauticUpdateRoleOutputSchema,
	displayName: 'Update Role',
	description: 'Updates fields of a Mautic role.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing role; Permissions, when given, replace the existing ones. Needs an administrator account. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Role Id',
			description: 'Numeric role id, from List Roles or Create Role.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isAdmin: mauticAiProps.yesNo({
			displayName: 'Administrator',
			description: 'Full access to everything; permissions are ignored.',
		}),
		rawPermissions: Property.Json({
			displayName: 'Permissions',
			description:
				'Permissions by bundle, e.g. {"email:emails": ["viewown", "editown", "create"], "lead:leads": ["full"]}.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description: 'Other role properties. The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { id, additionalFields, name, description, isAdmin, rawPermissions } = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'roles',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isAdmin', isAdmin),
				...spreadIfDefined('rawPermissions', rawPermissions),
			},
		});
	},
});
