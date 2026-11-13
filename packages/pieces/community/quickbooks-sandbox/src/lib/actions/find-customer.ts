import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../auth';
import { quickbooksApi } from '../common/api';
import type { QuickbooksEntityResponse, QuickbooksCustomer } from '../common/types';
import { findCustomerOutputSchema } from '../output-schemas';

export const findCustomerAction = createAction({
	auth: quickbooksAuth,
	name: 'find_customer',
	outputSchema: findCustomerOutputSchema,
	displayName: 'Find Customer',
	description: 'Search for a customer by display name in QuickBooks.',
	audience: 'human',
	aiMetadata: {
		description: 'Look up a single QuickBooks customer by exact display name, returning the first match. Use to resolve a customer name to its full record (including its Id) before referencing it elsewhere; the match is exact, not fuzzy. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		search_term: Property.ShortText({
			displayName: 'Customer Name',
			description: 'The display name of the customer to search for.',
			required: true,
		}),
	},
	async run(context) {
		const { search_term } = context.propsValue;
		if (!context.auth.props?.['companyId']) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		const query = `SELECT * FROM Customer WHERE DisplayName = '${search_term.replace(
			/'/g,
			"\\'",
		)}' MAXRESULTS 1`;

		const response = await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksCustomer>>({
			auth: context.auth,
			query,
		});

		if (
			response?.QueryResponse?.['Customer'] &&
			response.QueryResponse['Customer'].length > 0
		) {
			return {
				found: true,
				result: response.QueryResponse['Customer'][0],
			};
		}

		return {
			found: false,
			result: {},
		};
	},
});

