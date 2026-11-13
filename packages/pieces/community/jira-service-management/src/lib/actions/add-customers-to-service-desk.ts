import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { jsmAuth } from '../auth';
import { jsmClient } from '../common/client';
import { jsmProps } from '../common/props';
import { jsmUsers } from '../common/users';
import { customersAddedOutputSchema } from '../output-schemas';

export const addCustomersToServiceDeskAction = createAction({
	auth: jsmAuth,
	name: 'add_customers_to_service_desk',
	classification: 'WRITE',
	displayName: 'Add Customers to Service Desk',
	description: 'Lets existing customers raise requests in a service desk.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add one or more existing customers to a Jira Service Management service desk so they can raise requests there. The customers must already exist; create them with Create Customer first. Adding someone who is already a customer of the desk changes nothing, so it is safe to retry.',
		idempotent: true,
	},
	outputSchema: customersAddedOutputSchema,
	props: {
		serviceDeskId: jsmProps.serviceDesk(),
		customers: Property.Array({
			displayName: 'Customers',
			description: 'Customer emails. Data Center: usernames, which are usually the emails.',
			required: true,
		}),
	},
	async run(context) {
		const auth = context.auth.props;
		const { serviceDeskId } = context.propsValue;
		const customers = await jsmUsers.resolveMany({ auth, values: jsmUsers.toList(context.propsValue.customers) });
		if (customers.length === 0) {
			throw new Error('Add at least one customer email in the Customers field.');
		}
		await jsmClient.request<unknown>({
			auth,
			api: 'servicedesk',
			method: HttpMethod.POST,
			path: `/servicedesk/${encodeURIComponent(serviceDeskId)}/customer`,
			body: jsmUsers.peopleBody({ auth, ids: customers }),
			experimental: true,
		});
		return { success: true, service_desk_id: serviceDeskId, customers };
	},
});
