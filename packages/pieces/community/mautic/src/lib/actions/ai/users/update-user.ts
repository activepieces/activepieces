import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetUserOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateUserAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_user',
	outputSchema: mauticGetUserOutputSchema,
	displayName: 'Update User',
	description: 'Updates fields of a Mautic user.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing user; give Password only to change it. Needs an administrator account. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'User Id',
			description: 'Numeric user id, from List Users or Create User.',
		}),
		username: Property.ShortText({ displayName: 'Username', required: false }),
		email: Property.ShortText({ displayName: 'Email', required: false }),
		firstName: Property.ShortText({ displayName: 'First Name', required: false }),
		lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
		role: Property.Number({
			displayName: 'Role Id',
			description: 'Role id, from List Assignable Roles.',
			required: false,
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
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other user properties, e.g. "signature". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			id,
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
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'users',
			id,
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
