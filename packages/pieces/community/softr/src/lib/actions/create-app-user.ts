import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrOutputSchemas } from '../output-schemas';

export const createAppUser = createAction({
	auth: SoftrAuth,
	name: 'createAppUser',
	classification: 'WRITE',
	displayName: 'Create App User',
	description: 'Creates a new user inside a Softr app.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a user account in a published Softr app. Needs the app domain, email and full name; the password is optional (Softr makes one if empty) and it can also return a magic login link. Returns the new user. A second call with the same email fails because the user already exists.',
		idempotent: false,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'The email address of the new user.',
			required: true,
		}),
		full_name: Property.ShortText({
			displayName: 'Name',
			description: 'The full name of the new user.',
			required: true,
		}),
		password: Property.ShortText({
			displayName: 'Password',
			description: 'The password for the new user. Leave empty to let Softr generate one.',
			required: false,
		}),
		domain: Property.ShortText({
			displayName: 'Domain',
			description: 'Domain of the published Softr app to add the user to.',
			placeholder: 'myapp.softr.app',
			required: true,
		}),
		generate_magic_link: Property.Checkbox({
			displayName: 'Generate Magic Link',
			description: 'If checked, a magic link will be generated for the user.',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: softrOutputSchemas.createAppUser,
	async run({ auth, propsValue }) {
		const { email, full_name, password, generate_magic_link, domain } = propsValue;
		const trimmedEmail = email.trim();
		if (trimmedEmail.length === 0) {
			throw new Error('Email is required.');
		}
		const response = await softrClient.studioRequest({
			apiKey: auth.secret_text,
			domain,
			method: HttpMethod.POST,
			path: '',
			body: {
				email: trimmedEmail,
				full_name,
				...(password && password.length > 0 ? { password } : {}),
				generate_magic_link: generate_magic_link ?? false,
			},
		});
		return {
			success: true,
			message: 'User created successfully',
			user: {
				status: response.status,
				body: response.body,
			},
		};
	},
});
