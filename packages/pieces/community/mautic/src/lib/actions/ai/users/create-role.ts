import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateRoleOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateRoleAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_role',
	outputSchema: mauticCreateRoleOutputSchema,
	displayName: 'Create Role',
	description: 'Creates a Mautic role.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a role. Name is required; give Administrator or Permissions. Needs an administrator account.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
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
		const { additionalFields, name, description, isAdmin, rawPermissions } = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'roles',
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
