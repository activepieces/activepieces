import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../auth';
import { quickbooksApi } from '../common/api';
import type { QuickbooksEntityResponse, QuickbooksInvoice } from '../common/types';
import { findInvoiceOutputSchema } from '../output-schemas';

export const findInvoiceAction = createAction({
	auth: quickbooksAuth,
	name: 'find_invoice',
	outputSchema: findInvoiceOutputSchema,
	displayName: 'Find Invoice',
	description: 'Search for an invoice by its number in QuickBooks.',
	audience: 'human',
	aiMetadata: {
		description: 'Look up a single QuickBooks invoice by its document number (DocNumber), returning the first match. Use to resolve an invoice reference to its full record before reading or acting on it; the document number is required. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		invoice_number: Property.ShortText({
			displayName: 'Invoice Number',
			description: 'The document number (DocNumber) of the invoice to search for.',
			required: true,
		}),
	},
	async run(context) {
		const { invoice_number } = context.propsValue;
		if (!context.auth.props?.['companyId']) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		const query = `SELECT * FROM Invoice WHERE DocNumber = '${invoice_number.replace(
			/'/g,
			"\\'",
		)}' MAXRESULTS 1`;

		const response = await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksInvoice>>({
			auth: context.auth,
			query,
		});

		if (
			response?.QueryResponse?.['Invoice'] &&
			response.QueryResponse['Invoice'].length > 0
		) {
			return {
				found: true,
				result: response.QueryResponse['Invoice'][0],
			};
		}

		return {
			found: false,
			result: {},
		};
	},
});
