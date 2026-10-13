import { createAction } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { softrAppUsers } from '../common/app-users';
import { appDomainField, appUserEmailField } from '../common/props';
import { softrOutputSchemas } from '../output-schemas';

export const deactivateAppUser = createAction({
	auth: SoftrAuth,
	name: 'deactivateAppUser',
	classification: 'DESTRUCTIVE',
	displayName: 'Deactivate App User',
	description: 'Deactivates a user in a Softr app so they can no longer log in.',
	audience: 'both',
	aiMetadata: {
		description:
			'Stops a user of a published Softr app from logging in but keeps the account, which then no longer counts toward the plan user limit. Needs the app domain and user email. Prefer this over Delete App User when access may come back; undo it with Activate App User. Safe to retry.',
		idempotent: true,
	},
	props: {
		email: appUserEmailField,
		domain: appDomainField,
	},
	outputSchema: softrOutputSchemas.appUserStatus,
	async run({ auth, propsValue }) {
		return softrAppUsers.setUserStatus({
			apiKey: auth.secret_text,
			domain: propsValue.domain,
			email: propsValue.email,
			status: 'deactivate',
		});
	},
});
