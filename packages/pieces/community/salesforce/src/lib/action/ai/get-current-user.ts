import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { getCurrentUserOutputSchema } from '../../output-schemas';

export const getCurrentUser = createAction({
	auth: salesforceAuth,
	name: 'get_current_user',
	classification: 'READ',
	displayName: 'Get Current User',
	description: 'Get the connected Salesforce user and org.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the Salesforce user behind this connection (user id, username, name, email, locale, time zone, user type) and the org id. Use it to resolve "me" or "my" in a request, e.g. to filter by OwnerId in Run SOQL Query or to assign records to the current user. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getCurrentUserOutputSchema,
	props: {},
	async run(context) {
		const response = await callSalesforceApi<UserInfo>(
			HttpMethod.GET,
			context.auth,
			'/services/oauth2/userinfo',
			undefined
		);
		const user = response.body;
		return {
			user_id: user.user_id,
			organization_id: user.organization_id,
			username: user.preferred_username,
			name: user.name,
			email: user.email,
			locale: user.locale,
			zoneinfo: user.zoneinfo,
			user_type: user.user_type,
		};
	},
});

type UserInfo = {
	user_id: string;
	organization_id: string;
	preferred_username: string;
	name: string;
	email: string;
	locale: string;
	zoneinfo: string;
	user_type: string;
};
