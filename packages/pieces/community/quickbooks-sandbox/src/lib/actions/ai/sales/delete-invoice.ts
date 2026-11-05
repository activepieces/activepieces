import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteInvoiceOutputSchema } from '../../../output-schemas';

export const deleteInvoiceAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_invoice',
	outputSchema: quickbooksSandboxDeleteInvoiceOutputSchema,
	displayName: 'Delete Invoice',
	description: 'Permanently deletes an invoice.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one invoice; it cannot be restored. Use Void Invoice instead to keep the record with zero amounts. Get the id from List Invoices.',
		idempotent: false,
	},
	props: {
		invoiceId: quickbooksAiProps.id({
			required: true,
			displayName: 'Invoice ID',
			description: 'QuickBooks invoice id. Use List Invoices to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'Invoice',
			id: context.propsValue.invoiceId,
		});
	},
});
