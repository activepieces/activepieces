import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { jsmAuth, jsmConnection } from '../auth';
import { JsmUser, jsmClient } from '../common/client';
import { jsmUsers } from '../common/users';
import { customerOutputSchema } from '../output-schemas';

export const createCustomerAction = createAction({
	auth: jsmAuth,
	name: 'create_customer',
	classification: 'WRITE',
	displayName: 'Create Customer',
	description: 'Creates a customer account that can raise requests. On Jira Cloud the connected account must be a Jira administrator.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a Jira Service Management customer from an email and a name. The customer is not in any service desk yet; follow with Add Customers to Service Desk, passing the returned account ID on Jira Cloud because a new customer takes up to a minute to become searchable by email. Fails when a user with that email already exists, so do not retry after a success. On Jira Cloud it needs a connection of a Jira administrator.',
		idempotent: false,
	},
	outputSchema: customerOutputSchema,
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			placeholder: 'customer@example.com',
			required: true,
		}),
		fullName: Property.ShortText({
			displayName: 'Full Name',
			placeholder: 'Jane Doe',
			required: true,
		}),
	},
	async run(context) {
		const auth = jsmConnection.toProps(context.auth);
		const email = context.propsValue.email.trim();
		const fullName = context.propsValue.fullName.trim();
		const customer = await jsmClient.request<JsmUser>({
			auth,
			api: 'servicedesk',
			method: HttpMethod.POST,
			path: '/customer',
			body: jsmClient.isCloud(auth) ? { email, displayName: fullName } : { email, fullName },
			experimental: true,
		});
		return jsmUsers.flatten(customer);
	},
});
