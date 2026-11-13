import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxSendInvoiceOutputSchema } from '../../../output-schemas';

export const sendInvoiceAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_send_invoice',
	outputSchema: quickbooksSandboxSendInvoiceOutputSchema,
	displayName: 'Send Invoice',
	description: 'Emails an invoice to the customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Emails one invoice as a PDF, to Send To or, when empty, to the billing email on the invoice. Each call sends another email. Get the id from List Invoices.',
		idempotent: false,
	},
	props: {
		invoiceId: quickbooksAiProps.id({
			required: true,
			displayName: 'Invoice ID',
			description: 'QuickBooks invoice id. Use List Invoices to find it.',
		}),
		sendTo: quickbooksAiProps.sendTo({ required: false }),
	},
	async run(context) {
		return await quickbooksApi.sendEntity({
			auth: context.auth,
			entity: 'Invoice',
			id: context.propsValue.invoiceId,
			sendTo: context.propsValue.sendTo,
		});
	},
});
