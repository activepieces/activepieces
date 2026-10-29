import { createAction } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsCustomerOutputSchema } from '../../output-schemas';

export const zohoBookingsCreateCustomerAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_create_customer',
	outputSchema: zohoBookingsCustomerOutputSchema,
	displayName: 'Create Customer',
	description: 'Create a guest customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Create a customer, added as a guest. Pass Name, or First Name and Last Name, depending on how the account's customer name field is set up. Keep the returned customer ID: there is no action to look customers up later, and Update Customer and Delete Customer need it. Not idempotent.",
		idempotent: false,
	},
	props: zohoBookingsAiProps.customerFields(),
	async run({ auth, propsValue }) {
		if (!propsValue.name && !(propsValue.firstName && propsValue.lastName)) {
			throw new Error('Provide Name, or both First Name and Last Name.');
		}
		return await zohoBookingsApi.createCustomer({ auth, ...propsValue });
	},
});
