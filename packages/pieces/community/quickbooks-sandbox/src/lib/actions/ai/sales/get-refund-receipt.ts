import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateRefundReceiptOutputSchema } from '../../../output-schemas';

export const getRefundReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_refund_receipt',
	outputSchema: quickbooksSandboxCreateRefundReceiptOutputSchema,
	displayName: 'Get Refund Receipt',
	description: 'Gets one refund receipt by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one refund receipt with its lines, total, refund account and SyncToken. Get the id from List Refund Receipts or Create Refund Receipt.',
		idempotent: true,
	},
	props: {
		refundReceiptId: quickbooksAiProps.id({
			required: true,
			displayName: 'Refund Receipt ID',
			description: 'QuickBooks refund receipt id. Use List Refund Receipts to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'RefundReceipt',
			id: context.propsValue.refundReceiptId,
		});
	},
});
