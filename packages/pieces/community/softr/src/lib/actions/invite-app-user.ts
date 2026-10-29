import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { appDomainField, appUserEmailField } from '../common/props';
import { softrOutputSchemas } from '../output-schemas';

export const inviteAppUser = createAction({
	auth: SoftrAuth,
	name: 'inviteAppUser',
	classification: 'WRITE',
	displayName: 'Invite App User',
	description: 'Sends an invitation email to an existing user of a Softr app.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a Softr invitation email to an existing user of a published Softr app and marks them Invited. Needs the app domain and user email; create the user first with Create App User. Each call sends another email.',
		idempotent: false,
	},
	props: {
		email: appUserEmailField,
		domain: appDomainField,
	},
	outputSchema: softrOutputSchemas.appUserStatus,
	async run({ auth, propsValue }) {
		const email = propsValue.email.trim();
		if (email.length === 0) {
			throw new Error('User email is required.');
		}
		await softrClient.studioRequest({
			apiKey: auth.secret_text,
			domain: propsValue.domain,
			method: HttpMethod.POST,
			path: `/${encodeURIComponent(email)}/invite`,
		});
		return { success: true, email, message: 'Invitation sent' };
	},
});
