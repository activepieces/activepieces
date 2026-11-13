import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteRefundReceiptOutputSchema } from '../../../output-schemas';

export const deleteRefundReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_refund_receipt',
	outputSchema: quickbooksSandboxDeleteRefundReceiptOutputSchema,
	displayName: 'Delete Refund Receipt',
	description: 'Permanently deletes a refund receipt.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one refund receipt; it cannot be restored. Reads the latest SyncToken first. Get the id from List Refund Receipts.',
		idempotent: false,
	},
	props: {
		refundReceiptId: quickbooksAiProps.id({
			required: true,
			displayName: 'Refund Receipt ID',
			description: 'QuickBooks refund receipt id. Use List Refund Receipts to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'RefundReceipt',
			id: context.propsValue.refundReceiptId,
		});
	},
});
