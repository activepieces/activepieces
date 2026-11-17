import { Property, createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../auth';
import { quickbooksApi } from '../common/api';
import type { QuickbooksEntityResponse, QuickbooksPayment } from '../common/types';
import { findPaymentOutputSchema } from '../output-schemas';

export const findPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'find_payment',
	outputSchema: findPaymentOutputSchema,
	displayName: 'Find Payment',
	description: 'Finds an existing payment in QuickBooks.',
	audience: 'human',
	aiMetadata: {
		description: 'List all QuickBooks payments belonging to a given customer, identified by the customer Id (not name). Use to retrieve a customer\'s payment history or to check whether they have any payments on record. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		customerId: Property.ShortText({
			displayName: 'Customer ID',
			description: 'The ID of the customer to find payments for.',
			required: true,
		}),
	},
	async run(context) {
		const { customerId } = context.propsValue;
		if (!context.auth.props?.['companyId']) {
			throw new Error('Realm ID not found in authentication data. Please reconnect.');
		}

		const query = `SELECT * FROM Payment WHERE CustomerRef = '${customerId}'`;

		const response = await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksPayment>>({
			auth: context.auth,
			query,
		});

		if (
			response.QueryResponse?.['Payment'] &&
			response.QueryResponse?.['Payment'].length > 0
		) {
			return {
				found: true,
				result: response.QueryResponse?.['Payment'],
			};
		}

		return {
			found: false,
			result: [],
		};
	},
});
