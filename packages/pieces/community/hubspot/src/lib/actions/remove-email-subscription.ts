import { hubspotAuth } from '../../';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const removeEmailSubscriptionAction = createAction({
	auth: hubspotAuth,
	name: 'remove-email-subscription',
	displayName: 'Remove Email Subscription',
	description: 'Removes email subscription.',
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			required: true,
		}),
	},
	async run(context) {
		const { email } = context.propsValue;

       // https://developers.hubspot.com/docs/reference/api/marketing/subscriptions-preferences/v1#update-email-subscription-status-for-an-email-address
		const response = await httpClient.sendRequest({
			method: HttpMethod.PUT,
			url: `https://api.hubapi.com/email/public/v1/subscriptions/${email}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			body: {
				unsubscribeFromAll: true,
			},
		});

        return response.body;
	},
});
