import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { appDomainField, appUserEmailField } from '../common/props';

export const deleteAppUser = createAction({
	auth: SoftrAuth,
	name: 'deleteAppUser',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete App User',
	description: 'Deletes a user from a Softr app.',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently deletes a user from a published Softr app. Needs the app domain and user email. This cannot be undone; to only block login, use Deactivate App User. A second call fails with not found.',
		idempotent: false,
	},
	props: {
		email: appUserEmailField,
		domain: appDomainField,
	},
	async run({ auth, propsValue }) {
		const email = propsValue.email.trim();
		if (email.length === 0) {
			throw new Error('User email is required.');
		}
		const response = await softrClient.studioRequest({
			apiKey: auth.secret_text,
			domain: propsValue.domain,
			method: HttpMethod.DELETE,
			path: `/${encodeURIComponent(email)}`,
		});
		return {
			success: true,
			message: `User ${email} deleted successfully from ${propsValue.domain.trim()}`,
			statusCode: response.status,
		};
	},
});
