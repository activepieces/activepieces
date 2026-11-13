import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsDeleteRecordOutputSchema } from '../../output-schemas';

export const zohoBookingsDeleteCustomerAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_delete_customer',
	outputSchema: zohoBookingsDeleteRecordOutputSchema,
	displayName: 'Delete Customer',
	description: 'Permanently delete a customer.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Permanently delete a customer by customer ID. Fails while the customer has upcoming appointments. The ID comes from Create Customer or from the customer's page URL in Zoho Bookings.",
		idempotent: false,
	},
	props: {
		customerId: Property.ShortText({
			displayName: 'Customer ID',
			description:
				"From Create Customer, or the number in the customer's page URL in Zoho Bookings.",
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoBookingsApi.deleteCustomer({ auth, customerId: propsValue.customerId });
	},
});
