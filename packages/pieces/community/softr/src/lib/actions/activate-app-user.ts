import { createAction } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { softrAppUsers } from '../common/app-users';
import { appDomainField, appUserEmailField } from '../common/props';
import { softrOutputSchemas } from '../output-schemas';

export const activateAppUser = createAction({
	auth: SoftrAuth,
	name: 'activateAppUser',
	classification: 'WRITE',
	displayName: 'Activate App User',
	description: 'Reactivates a deactivated user in a Softr app.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lets a deactivated user of a published Softr app log in again. Needs the app domain and the user email. Undoes Deactivate App User. Safe to retry.',
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
			status: 'activate',
		});
	},
});
