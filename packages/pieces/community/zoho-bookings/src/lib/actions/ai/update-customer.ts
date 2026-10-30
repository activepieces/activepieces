import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsCustomerOutputSchema } from '../../output-schemas';

export const zohoBookingsUpdateCustomerAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_update_customer',
	outputSchema: zohoBookingsCustomerOutputSchema,
	displayName: 'Update Customer',
	description: "Update a customer's name, email or phone.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Change a customer's name, email or phone by customer ID. Only the fields you pass change. The ID comes from Create Customer or from the customer's page URL in Zoho Bookings.",
		idempotent: true,
	},
	props: {
		customerId: Property.ShortText({
			displayName: 'Customer ID',
			description:
				"From Create Customer, or the number in the customer's page URL in Zoho Bookings.",
			required: true,
		}),
		...zohoBookingsAiProps.customerFields(),
	},
	async run({ auth, propsValue }) {
		const { customerId, ...customer } = propsValue;
		if (Object.values(customer).every((value) => value === undefined)) {
			throw new Error('Provide at least one field to update.');
		}
		return await zohoBookingsApi.updateCustomer({ auth, customerId, ...customer });
	},
});
