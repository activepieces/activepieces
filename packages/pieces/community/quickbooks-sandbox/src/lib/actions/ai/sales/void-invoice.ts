import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxVoidInvoiceOutputSchema } from '../../../output-schemas';

export const voidInvoiceAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_void_invoice',
	outputSchema: quickbooksSandboxVoidInvoiceOutputSchema,
	displayName: 'Void Invoice',
	description: 'Voids an invoice, keeping it on record with zero amounts.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Voids one invoice: its amounts become zero and it stays on record marked Voided, unlike Delete Invoice which removes it. Cannot be undone. Get the id from List Invoices.',
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
		return await quickbooksApi.voidEntity({
			auth: context.auth,
			entity: 'Invoice',
			id: context.propsValue.invoiceId,
		});
	},
});
