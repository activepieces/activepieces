import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateInvoiceOutputSchema } from '../../../output-schemas';

export const getInvoiceAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_invoice',
	outputSchema: quickbooksSandboxCreateInvoiceOutputSchema,
	displayName: 'Get Invoice',
	description: 'Gets one invoice by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one invoice with its lines, totals, open Balance, linked payments and SyncToken. Get the id from List Invoices or Create Invoice.',
		idempotent: true,
	},
	props: {
		invoiceId: quickbooksAiProps.id({
			required: true,
			displayName: 'Invoice ID',
			description: 'QuickBooks invoice id. Use List Invoices to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Invoice',
			id: context.propsValue.invoiceId,
		});
	},
});
