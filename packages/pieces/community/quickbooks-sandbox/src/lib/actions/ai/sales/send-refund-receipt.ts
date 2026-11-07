import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxSendRefundReceiptOutputSchema } from '../../../output-schemas';

export const sendRefundReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_send_refund_receipt',
	outputSchema: quickbooksSandboxSendRefundReceiptOutputSchema,
	displayName: 'Send Refund Receipt',
	description: 'Emails a refund receipt to the customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Emails one refund receipt as a PDF, to Send To or, when empty, to the billing email on the refund receipt. Each call sends another email. Get the id from List Refund Receipts.',
		idempotent: false,
	},
	props: {
		refundReceiptId: quickbooksAiProps.id({
			required: true,
			displayName: 'Refund Receipt ID',
			description: 'QuickBooks refund receipt id. Use List Refund Receipts to find it.',
		}),
		sendTo: quickbooksAiProps.sendTo({ required: false }),
	},
	async run(context) {
		return await quickbooksApi.sendEntity({
			auth: context.auth,
			entity: 'RefundReceipt',
			id: context.propsValue.refundReceiptId,
			sendTo: context.propsValue.sendTo,
		});
	},
});
