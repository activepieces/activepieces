import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateUserOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateUserAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_user',
	outputSchema: mauticCreateUserOutputSchema,
	displayName: 'Create User',
	description: 'Creates a Mautic user.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a Mautic user. Username, Email, First Name, Last Name, Role Id and Password are required. Needs an administrator account.',
		idempotent: false,
	},
	props: {
		username: Property.ShortText({ displayName: 'Username', required: true }),
		email: Property.ShortText({ displayName: 'Email', required: true }),
		firstName: Property.ShortText({ displayName: 'First Name', required: true }),
		lastName: Property.ShortText({ displayName: 'Last Name', required: true }),
		role: Property.Number({
			displayName: 'Role Id',
			description: 'Role id, from List Assignable Roles.',
			required: true,
		}),
		position: Property.ShortText({ displayName: 'Position', required: false }),
		timezone: Property.ShortText({
			displayName: 'Timezone',
			description: 'e.g. "Europe/Berlin".',
			required: false,
		}),
		locale: Property.ShortText({
			displayName: 'Locale',
			description: 'e.g. "en_US".',
			required: false,
		}),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		password: Property.ShortText({
			displayName: 'Password',
			description: 'Password for the user to sign in with.',
			required: true,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other user properties, e.g. "signature". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			password,
			username,
			email,
			firstName,
			lastName,
			role,
			position,
			timezone,
			locale,
			isPublished,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'users',
			body: {
				...additionalFields,
				...spreadIfDefined('username', username),
				...spreadIfDefined('email', email),
				...spreadIfDefined('firstName', firstName),
				...spreadIfDefined('lastName', lastName),
				...spreadIfDefined('role', role),
				...spreadIfDefined('position', position),
				...spreadIfDefined('timezone', timezone),
				...spreadIfDefined('locale', locale),
				...spreadIfDefined('isPublished', isPublished),
				...(password ? { plainPassword: { password, confirm: password } } : {}),
			},
		});
	},
});
